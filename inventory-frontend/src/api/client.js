import axios from "axios";
import { clearRequestCache } from "./requestCache";
import { clearPageCache } from "../store/pageCache";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://saristore-ims-backend.onrender.com";
const API_TIMEOUT_MS = 30000;
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: API_TIMEOUT_MS,
});

const refreshClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: API_TIMEOUT_MS,
});

let refreshPromise = null;
let logoutInProgress = false;
let failedRequestQueue = [];

const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

const persistTokens = ({ accessToken, refreshToken }) => {
    if (!accessToken || !refreshToken) {
        throw new Error("Refresh response did not include tokens");
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
};

const clearSession = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearRequestCache();
    clearPageCache();
    delete api.defaults.headers.common.Authorization;
};

const logoutOnce = () => {
    if (logoutInProgress) return;

    logoutInProgress = true;
    clearSession();

    if (window.location.pathname !== "/login") {
        window.location.replace("/login");
    }
};

const resolveFailedQueue = (error, accessToken = null) => {
    failedRequestQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(accessToken);
        }
    });

    failedRequestQueue = [];
};

const isAuthEndpoint = (url = "") => (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/refresh")
);

const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        throw new Error("No refresh token available");
    }

    const response = await refreshClient.post("/api/auth/refresh", { refreshToken });
    const data = response.data?.data || response.data;

    const tokens = {
        accessToken: data?.accessToken ?? data?.token ?? data?.access_token,
        refreshToken: data?.refreshToken ?? data?.refresh_token,
    };

    persistTokens(tokens);
    return tokens.accessToken;
};

const getRefreshPromise = () => {
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken()
            .then((accessToken) => {
                resolveFailedQueue(null, accessToken);
                return accessToken;
            })
            .catch((error) => {
                resolveFailedQueue(error);
                logoutOnce();
                throw error;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

api.interceptors.request.use(
    async (config) => {
        if (refreshPromise && !config._skipAuthRefresh && !isAuthEndpoint(config.url)) {
            await refreshPromise;
        }

        const token = getAccessToken();

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (
            status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            originalRequest._skipAuthRefresh ||
            isAuthEndpoint(originalRequest.url)
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (refreshPromise) {
                const queuedToken = await new Promise((resolve, reject) => {
                    failedRequestQueue.push({ resolve, reject });
                });

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${queuedToken}`;

                return api(originalRequest);
            }

            const newAccessToken = await getRefreshPromise();

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return api(originalRequest);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    }
);
