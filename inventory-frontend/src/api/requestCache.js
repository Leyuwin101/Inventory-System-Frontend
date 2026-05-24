const DEFAULT_TTL = 5 * 60_000;
const DEFAULT_STALE_TTL = 30 * 60_000;
const MAX_STORED_ENTRIES = 80;
const STORAGE_PREFIX = "ims:request-cache:";

const responseCache = new Map();
const pendingRequests = new Map();
const listeners = new Map();

const now = () => Date.now();
const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

const readStoredCache = (key) => {
    if (!canUseStorage()) return null;

    try {
        const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (!stored) return null;

        const parsed = JSON.parse(stored);
        if (!parsed?.staleAt && parsed?.expiresAt) {
            parsed.staleAt = parsed.expiresAt + DEFAULT_STALE_TTL;
        }

        if (!parsed?.staleAt || parsed.staleAt <= now()) {
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
        pruneStoredCache();
    } catch {
        // Storage quota should never block live API data.
    }
};

const pruneStoredCache = () => {
    if (!canUseStorage()) return;

    const entries = Object.keys(window.localStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .map((storageKey) => {
            try {
                const entry = JSON.parse(window.localStorage.getItem(storageKey));
                return { storageKey, updatedAt: entry?.updatedAt || 0, staleAt: entry?.staleAt || 0 };
            } catch {
                return { storageKey, updatedAt: 0, staleAt: 0 };
            }
        })
        .sort((a, b) => (b.updatedAt || b.staleAt) - (a.updatedAt || a.staleAt));

    entries.slice(MAX_STORED_ENTRIES).forEach(({ storageKey }) => {
        window.localStorage.removeItem(storageKey);
    });
};

const notify = (key, data) => {
    listeners.get(key)?.forEach((listener) => listener(data));
};

const writeCache = (key, data, ttl = DEFAULT_TTL, staleTtl = DEFAULT_STALE_TTL) => {
    const entry = {
        data,
        expiresAt: now() + ttl,
        staleAt: now() + ttl + staleTtl,
        updatedAt: now(),
    };

    responseCache.set(key, entry);
    writeStoredCache(key, entry);
    notify(key, data);
    return data;
};

const refreshRequest = (key, requestFn, ttl, staleTtl, cached, fallbackOnError) => {
    if (pendingRequests.has(key)) return pendingRequests.get(key);

    const promise = Promise.resolve()
        .then(requestFn)
        .then((data) => writeCache(key, data, ttl, staleTtl))
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

export const cachedRequest = (key, requestFn, {
    ttl = DEFAULT_TTL,
    staleTtl = DEFAULT_STALE_TTL,
    force = false,
    fallbackOnError = true,
    revalidate = true,
} = {}) => {
    const cached = responseCache.get(key) || readStoredCache(key);
    const isFresh = cached && cached.expiresAt > now();
    const isStaleButUsable = cached && cached.staleAt > now();

    if (!force && isFresh) {
        return Promise.resolve(cached.data);
    }

    if (!force && isStaleButUsable && revalidate) {
        // Stale-while-revalidate keeps screens fast while one background request
        // quietly refreshes shared data for every subscriber.
        refreshRequest(key, requestFn, ttl, staleTtl, cached, true);
        return Promise.resolve(cached.data);
    }

    return refreshRequest(key, requestFn, ttl, staleTtl, cached, fallbackOnError);
};

export const getCachedData = (key) => {
    const cached = responseCache.get(key) || readStoredCache(key);
    return cached?.data;
};

export const setCachedData = (key, data, options = {}) => {
    return writeCache(key, data, options.ttl, options.staleTtl);
};

export const mutateCache = (key, updater, options = {}) => {
    const current = getCachedData(key);
    const next = typeof updater === "function" ? updater(current) : updater;
    return writeCache(key, next, options.ttl, options.staleTtl);
};

export const subscribeCache = (key, listener) => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(listener);
    return () => {
        listeners.get(key)?.delete(listener);
        if (listeners.get(key)?.size === 0) listeners.delete(key);
    };
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

    for (const key of listeners.keys()) {
        if (!prefix || key.startsWith(prefix)) {
            notify(key, undefined);
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
