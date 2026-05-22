import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clearAuthCache, getCurrentUser } from "../../api/auth.js";
import { clearRequestCache } from "../../api/requestCache.js";
import { clearPageCache } from "../../store/pageCache.js";
import { clearTokens, setTokens } from "../../api/token.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authHydrated, setAuthHydrated] = useState(false);
    const mountedRef = useRef(false);
    const hydrationPromiseRef = useRef(null);

    const commitUser = useCallback((nextUser) => {
        setUser(nextUser);

        if (nextUser) {
            localStorage.setItem("user", JSON.stringify(nextUser));
        } else {
            localStorage.removeItem("user");
        }
    }, []);

    const logout = useCallback(() => {
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
            const token = localStorage.getItem("accessToken");

            if (!token) {
                if (mountedRef.current) {
                    commitUser(null);
                    setAuthHydrated(true);
                    setAuthLoading(false);
                }
                return null;
            }

            if (force) {
                clearAuthCache();
            }

            if (mountedRef.current) {
                setAuthLoading(true);
            }

            try {
                const currentUser = await getCurrentUser();

                if (mountedRef.current) {
                    commitUser(currentUser);
                    setAuthHydrated(true);
                    setAuthLoading(false);
                }

                return currentUser;
            } catch (err) {
                console.error("Auth hydration failed:", err);

                if (mountedRef.current) {
                    commitUser(null);
                    setAuthHydrated(true);
                    setAuthLoading(false);
                }

                if (!silentFailure) {
                    throw err;
                }

                return null;
            } finally {
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

        if (loginUser) {
            commitUser(loginUser);
            setAuthHydrated(true);
            setAuthLoading(false);
            return loginUser;
        }

        return hydrateAuth({ force: true, silentFailure: false });
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

export const useAuth = () => useContext(AuthContext);
