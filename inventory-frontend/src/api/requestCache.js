const DEFAULT_TTL = 5 * 60_000;
const STORAGE_PREFIX = "ims:request-cache:";

const responseCache = new Map();
const pendingRequests = new Map();

const now = () => Date.now();
const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

const readStoredCache = (key) => {
    if (!canUseStorage()) return null;

    try {
        const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (!stored) return null;

        const parsed = JSON.parse(stored);
        if (!parsed?.expiresAt || parsed.expiresAt <= now()) {
            window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
            return null;
        }

        responseCache.set(key, parsed);
        return parsed;
    } catch {
        return null;
    }
};

const writeStoredCache = (key, entry) => {
    if (!canUseStorage()) return;

    try {
        window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
        // Storage quota should never block live API data.
    }
};

export const cachedRequest = (key, requestFn, { ttl = DEFAULT_TTL, force = false, fallbackOnError = true } = {}) => {
    const cached = responseCache.get(key) || readStoredCache(key);

    if (!force && cached && cached.expiresAt > now()) {
        return Promise.resolve(cached.data);
    }

    if (!force && pendingRequests.has(key)) {
        return pendingRequests.get(key);
    }

    const promise = Promise.resolve()
        .then(requestFn)
        .then((data) => {
            const entry = {
                data,
                expiresAt: now() + ttl,
            };

            responseCache.set(key, entry);
            writeStoredCache(key, entry);
            return data;
        })
        .catch((error) => {
            if (fallbackOnError && cached?.data) return cached.data;
            throw error;
        })
        .finally(() => {
            pendingRequests.delete(key);
        });

    pendingRequests.set(key, promise);
    return promise;
};

export const invalidateCache = (prefix = "") => {
    for (const key of responseCache.keys()) {
        if (!prefix || key.startsWith(prefix)) {
            responseCache.delete(key);
        }
    }

    for (const key of pendingRequests.keys()) {
        if (!prefix || key.startsWith(prefix)) {
            pendingRequests.delete(key);
        }
    }

    if (canUseStorage()) {
        for (const key of Object.keys(window.localStorage)) {
            if (key.startsWith(STORAGE_PREFIX)) {
                const cacheKey = key.slice(STORAGE_PREFIX.length);
                if (!prefix || cacheKey.startsWith(prefix)) {
                    window.localStorage.removeItem(key);
                }
            }
        }
    }
};

export const clearRequestCache = () => {
    responseCache.clear();
    pendingRequests.clear();

    if (canUseStorage()) {
        for (const key of Object.keys(window.localStorage)) {
            if (key.startsWith(STORAGE_PREFIX)) {
                window.localStorage.removeItem(key);
            }
        }
    }
};
