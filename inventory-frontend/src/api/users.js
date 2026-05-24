import { api } from "./client";
import { asArray, normalizeUser, unwrapApiData } from "./normalizers";
import { cachedRequest, invalidateCache } from "./requestCache";

const USERS_CACHE_KEY = "users:";

export const getAllUsers = async () => {
    return cachedRequest(`${USERS_CACHE_KEY}all`, async () => {
        const res = await api.get("/api/users");
        return asArray(res.data).map(normalizeUser);
    }, { ttl: 60_000, fallbackOnError: false });
};

export const getUserById = async (id) => {
    return cachedRequest(`${USERS_CACHE_KEY}detail:${id}`, async () => {
        const res = await api.get(`/api/users/${id}`);
        return normalizeUser(unwrapApiData(res.data));
    }, { ttl: 60_000, fallbackOnError: false });
};

export const createUser = async (payload) => {
    const res = await api.post("/api/users", payload);
    invalidateCache(USERS_CACHE_KEY);
    return normalizeUser(unwrapApiData(res.data));
};

export const updateUserById = async (id, payload) => {
    const res = await api.put(`/api/users/${id}`, payload);
    invalidateCache(USERS_CACHE_KEY);
    return normalizeUser(unwrapApiData(res.data));
};

export const terminateUser = async (id) => {
    const res = await api.delete(`/api/users/${id}`);
    invalidateCache(USERS_CACHE_KEY);
    return unwrapApiData(res.data);
};

export const clearUsersCache = () => {
    invalidateCache(USERS_CACHE_KEY);
};
