const DEFAULT_TTL = 60_000;

const responseCache = new Map();
const pendingRequests = new Map();

const now = () => Date.now();

export const cachedRequest = (key, requestFn, { ttl = DEFAULT_TTL, force = false } = {}) => {
    const cached = responseCache.get(key);

    if (!force && cached && cached.expiresAt > now()) {
        return Promise.resolve(cached.data);
    }

    if (!force && pendingRequests.has(key)) {
        return pendingRequests.get(key);
    }

    const promise = Promise.resolve()
        .then(requestFn)
        .then((data) => {
            responseCache.set(key, {
                data,
                expiresAt: now() + ttl,
            });
            return data;
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
};

export const clearRequestCache = () => {
    responseCache.clear();
    pendingRequests.clear();
};
