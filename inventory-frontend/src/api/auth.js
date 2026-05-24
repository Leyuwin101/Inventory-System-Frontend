import { api } from "./client";
import { cachedRequest, invalidateCache } from "./requestCache";

const getTokenPair = (data = {}) => ({
    accessToken: data.accessToken ?? data.token ?? data.access_token,
    refreshToken: data.refreshToken ?? data.refresh_token,
});

const getUserPayload = (data = {}) => (
    data.user ??
    data.authUser ??
    data.authUserResponse ??
    data.currentUser ??
    null
);

const isEmailLike = (value = "") => String(value).includes("@");
const ROLE_VALUES = new Set([
    "ADMIN",
    "MANAGER",
    "CASHIER",
    "INVENTORY_CLERK",
    "STANDARD_USER",
    "MEMBER",
    "ROLE_ADMIN",
    "ROLE_MANAGER",
    "ROLE_CASHIER",
    "ROLE_INVENTORY_CLERK",
    "ROLE_STANDARD_USER",
    "ROLE_MEMBER",
]);
const isRoleLike = (value = "") => ROLE_VALUES.has(String(value).trim().toUpperCase());
const firstNonEmail = (...values) => (
    values
        .map((value) => String(value || "").trim())
        .find((value) => value && !isEmailLike(value) && !isRoleLike(value)) || ""
);
const getUsernameValue = (user = {}) => firstNonEmail(
    user.username,
    user.userName,
    user.name,
    user.displayName,
    user.fullName,
    user.login
);

const normalizeRole = (role) => {
    const value = Array.isArray(role) ? role[0] : role;
    return String(value || "").replace("ROLE_", "").toUpperCase();
};

export const normalizeAuthUser = (user = {}) => {
    const id = user.id ?? user.userId ?? user.userID;
    const username = getUsernameValue(user);

    return {
        ...user,
        id,
        userId: id,
        userID: id,
        username,
        name: username,
        email: user.email ?? "",
        role: normalizeRole(user.role),
    };
};

export const decodeJwtPayload = (token) => {
    try {
        const [, payload] = token.split(".");
        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(normalizedPayload)
                .split("")
                .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
                .join("")
        );

        return JSON.parse(json);
    } catch {
        return null;
    }
};

export const getUserFromToken = (accessToken) => {
    const payload = decodeJwtPayload(accessToken);
    if (!payload) return null;

    const role = payload.role || payload.authority || payload.roles?.[0] || payload.scope;
    const username = firstNonEmail(payload.username, payload.userName, payload.name);
    const email = payload.email || (isEmailLike(payload.sub) ? payload.sub : "");

    return normalizeAuthUser({
        id: payload.userID || payload.userId || payload.id,
        username,
        name: username,
        email,
        role,
    });
};

export const isTokenExpired = (token, skewMs = 30_000) => {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return false;
    return (payload.exp * 1000) <= Date.now() + skewMs;
};


/**
 * Authenticates user and stores JWT tokens.
 *
 * Flow:
 * - sends login request to backend
 * - receives access + refresh tokens
 * - stores tokens in localStorage
 *
 * @param {string} email user email
 * @param {string} password user password
 * @returns {Promise} full API response
 */
export const login = async (loginId, password) => {
    const identifier = loginId.trim();
    const credentials = identifier.includes("@")
        ? { email: identifier, password }
        : { username: identifier, password };

    const res = await api.post(
        "/api/auth/login",
        credentials,
        { _skipAuthRefresh: true }
    );

    const data = res.data?.data || res.data;
    const { accessToken, refreshToken } = getTokenPair(data);

    return {
        ...data,
        accessToken,
        refreshToken,
        user: normalizeAuthUser(getUserPayload(data) || getUserFromToken(accessToken)),
    };
};


/**
 * Requests a new access token using a refresh token.
 *
 * @param {string} token refresh token
 * @returns {Promise} backend response containing new tokens
 */
export const refreshToken = (refreshToken) => {
    return api.post("/api/auth/refresh", { refreshToken });
};

/**
 * Gets the currently authenticated user.
 *
 * Requires:
 * - valid access token in Authorization header (handled by api client interceptor)
 *
 * @returns {Promise} user profile (email, username, role)
 */
export const getCurrentUser = async ({ signal, force = false } = {}) => {
    return cachedRequest("auth:me", async () => {
        const res = await api.get("/api/auth/me", {
            signal,
            timeout: 4_000,
        });
        const currentUser = normalizeAuthUser(res.data?.data || res.data);

        if (currentUser.username) {
            return currentUser;
        }

        if (currentUser.id) {
            try {
                const detailRes = await api.get(`/api/users/${currentUser.id}`, {
                    signal,
                    timeout: 4_000,
                });
                return normalizeAuthUser({
                    ...currentUser,
                    ...(detailRes.data?.data || detailRes.data),
                });
            } catch {
                return currentUser;
            }
        }

        return currentUser;
    }, { ttl: 5 * 60_000, staleTtl: 15 * 60_000, fallbackOnError: false, force });
};

export const updateCurrentUser = async (payload) => {
    const res = await api.put("/api/auth/me", payload, { timeout: 6_000 });
    invalidateCache("auth:");
    return normalizeAuthUser(res.data?.data || res.data);
};

export const clearAuthCache = () => {
    invalidateCache("auth:");
};
