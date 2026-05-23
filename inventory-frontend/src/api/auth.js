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

const normalizeAuthUser = (user = {}) => ({
    ...user,
    id: user.id ?? user.userId ?? user.userID,
    userId: user.userId ?? user.id ?? user.userID,
    userID: user.userID ?? user.userId ?? user.id,
    username: user.username ?? user.name ?? "",
    name: user.name ?? user.username ?? "",
    email: user.email ?? "",
    role: user.role,
});

const decodeJwtPayload = (token) => {
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

const getUserFromToken = (accessToken) => {
    const payload = decodeJwtPayload(accessToken);
    if (!payload) return null;

    const role = payload.role || payload.authority || payload.roles?.[0] || payload.scope;
    const username = payload.username || payload.sub || payload.name || payload.email;

    return {
        id: payload.userID || payload.userId || payload.id,
        userID: payload.userID || payload.userId || payload.id,
        username,
        name: payload.name || username,
        email: payload.email || (username?.includes("@") ? username : ""),
        role: Array.isArray(role) ? role[0] : role,
    };
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
        user: getUserPayload(data) || getUserFromToken(accessToken),
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
export const getCurrentUser = async () => {
    return cachedRequest("auth:me", async () => {
        const res = await api.get("/api/auth/me");
        return normalizeAuthUser(res.data?.data || res.data);
    }, { ttl: 120_000, fallbackOnError: false });
};

export const updateCurrentUser = async (payload) => {
    const res = await api.put("/api/auth/me", payload);
    invalidateCache("auth:");
    return normalizeAuthUser(res.data?.data || res.data);
};

export const clearAuthCache = () => {
    invalidateCache("auth:");
};
