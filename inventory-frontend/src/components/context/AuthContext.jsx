import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clearAuthCache, getCurrentUser, getUserFromToken, isTokenExpired, normalizeAuthUser } from "../../api/auth.js";
import { clearRequestCache } from "../../api/requestCache.js";
import { clearPageCache } from "../../store/pageCache.js";
import { clearTokens, getRefreshToken, getToken, setTokens } from "../../api/token.js";

const AuthContext = createContext();
const readStoredUser = () => {
    try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        return storedUser ? normalizeAuthUser(storedUser) : null;
    } catch {
        return null;
    }
};

const isEmailLike = (value = "") => String(value).includes("@");
const isRoleLike = (value = "") => {
    const normalized = String(value || "").replace("ROLE_", "").toUpperCase();
    return ["ADMIN", "MANAGER", "CASHIER", "INVENTORY_CLERK", "STANDARD_USER", "MEMBER"].includes(normalized);
};
const getRealUsername = (nextUser) => {
    const username = String(nextUser?.username || nextUser?.name || "").trim();
    return username && !isEmailLike(username) && !isRoleLike(username) ? username : "";
};
const hasRealUsername = (nextUser) => {
    return Boolean(getRealUsername(nextUser));
};

const getInitialUser = () => {
    const accessToken = getToken();
    const refreshToken = getRefreshToken();
    if (!accessToken && !refreshToken) return null;

    const storedUser = readStoredUser();
    const tokenUser = accessToken ? getUserFromToken(accessToken) : null;

    if (!accessToken) return readStoredUser();
    if (isTokenExpired(accessToken, 0) && !refreshToken) return null;
    return hasRealUsername(storedUser) ? storedUser : tokenUser || storedUser;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getInitialUser);
    const [authLoading, setAuthLoading] = useState(() => {
        const accessToken = getToken();
        const initialUser = getInitialUser();
        return Boolean(!initialUser && (accessToken || getRefreshToken()));
    });
    const [authHydrated, setAuthHydrated] = useState(() => {
        const initialUser = getInitialUser();
        return Boolean(initialUser || (!getToken() && !getRefreshToken()));
    });
    const mountedRef = useRef(false);
    const hydrationPromiseRef = useRef(null);
    const hydrationControllerRef = useRef(null);

    const commitUser = useCallback((nextUser) => {
        if (nextUser) {
            const normalizedUser = normalizeAuthUser(nextUser);
            const mergedUser = normalizeAuthUser({
                ...normalizedUser,
                username: getRealUsername(normalizedUser),
                name: getRealUsername(normalizedUser),
            });

            setUser(mergedUser);
            localStorage.setItem("user", JSON.stringify(mergedUser));
        } else {
            setUser(null);
            localStorage.removeItem("user");
        }
    }, []);

    const logout = useCallback(() => {
        hydrationControllerRef.current?.abort();
        clearTokens();
        localStorage.removeItem("user");
        clearAuthCache();
        clearRequestCache();
        clearPageCache();
        setUser(null);
        setAuthHydrated(true);
        setAuthLoading(false);
    }, []);

    const hydrateAuth = useCallback(async ({ force = false, silentFailure = true } = {}) => {
        if (hydrationPromiseRef.current && !force) {
            return hydrationPromiseRef.current;
        }

        const hydratePromise = (async () => {
            hydrationControllerRef.current?.abort();
            const controller = new AbortController();
            hydrationControllerRef.current = controller;

            if (force) {
                clearAuthCache();
            }

            const accessToken = getToken();
            const refreshToken = getRefreshToken();
            const fallbackUser = readStoredUser() || (accessToken ? getUserFromToken(accessToken) : null);
            const fallbackHasUsername = hasRealUsername(fallbackUser);

            if (!accessToken && !refreshToken) {
                if (mountedRef.current) {
                    commitUser(null);
                    setAuthHydrated(true);
                    setAuthLoading(false);
                }
                return null;
            }

            if (fallbackUser && mountedRef.current) {
                commitUser(fallbackUser);
                setAuthHydrated(true);
                setAuthLoading(false);
            }

            if (accessToken && !isTokenExpired(accessToken) && fallbackUser && fallbackHasUsername && !force) {
                if (mountedRef.current) {
                    setAuthHydrated(true);
                    setAuthLoading(false);
                }

                getCurrentUser({ signal: controller.signal })
                    .then((currentUser) => {
                        if (mountedRef.current && currentUser) {
                            commitUser(currentUser);
                        }
                    })
                    .catch((err) => {
                        const status = err.response?.status;
                        if ((status === 401 || status === 403) && mountedRef.current) {
                            commitUser(null);
                            setAuthHydrated(true);
                            setAuthLoading(false);
                        }
                    });

                return fallbackUser;
            }

            if (mountedRef.current) {
                setAuthLoading(Boolean(!fallbackUser));
            }

            try {
                const currentUser = await getCurrentUser({ signal: controller.signal, force: force || !fallbackHasUsername });

                if (mountedRef.current) {
                    commitUser(currentUser);
                    setAuthHydrated(true);
                    setAuthLoading(false);
                }

                return currentUser;
            } catch (err) {
                const status = err.response?.status;
                const isCanceled = err.name === "CanceledError" || err.code === "ERR_CANCELED";

                if (!isCanceled && err.code !== "ECONNABORTED") {
                    console.error("Auth hydration failed:", err);
                }

                if (mountedRef.current) {
                    if (status === 401 || status === 403 || (!fallbackUser && !refreshToken)) {
                        commitUser(null);
                    } else {
                        commitUser(fallbackUser);
                    }
                    setAuthHydrated(true);
                    setAuthLoading(false);
                }

                if (!silentFailure) {
                    throw err;
                }

                return null;
            } finally {
                if (hydrationControllerRef.current === controller) {
                    hydrationControllerRef.current = null;
                }
                hydrationPromiseRef.current = null;
            }
        })();

        hydrationPromiseRef.current = hydratePromise;
        return hydratePromise;
    }, [commitUser]);

    useEffect(() => {
        mountedRef.current = true;
        hydrateAuth();

        return () => {
            hydrationControllerRef.current?.abort();
            mountedRef.current = false;
        };
    }, [hydrateAuth]);

    const refreshAuth = useCallback(async () => {
        return hydrateAuth({ force: true, silentFailure: false });
    }, [hydrateAuth]);

    const completeLogin = useCallback(async ({ accessToken, refreshToken, user: loginUser }) => {
        setAuthLoading(true);
        setTokens(accessToken, refreshToken);
        clearAuthCache();
        clearRequestCache();
        clearPageCache();

        const tokenUser = getUserFromToken(accessToken);
        const sessionUser = normalizeAuthUser(loginUser || tokenUser);

        if (sessionUser) {
            commitUser(sessionUser);
        }

        setAuthHydrated(true);
        setAuthLoading(false);

        hydrateAuth({ force: true, silentFailure: true }).catch(() => {});

        return sessionUser;
    }, [commitUser, hydrateAuth]);

    const updateUser = useCallback((updatedUserData) => {
        commitUser(updatedUserData);
        clearAuthCache();
    }, [commitUser]);

    const value = useMemo(() => ({
        user,
        authLoading,
        authHydrated,
        loading: authLoading,
        refreshAuth,
        completeLogin,
        logout,
        updateUser,
    }), [user, authLoading, authHydrated, refreshAuth, completeLogin, logout, updateUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
