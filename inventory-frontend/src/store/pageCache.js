const pageCache = new Map();

export const getPageCache = (key) => pageCache.get(key);

export const setPageCache = (key, value) => {
    pageCache.set(key, {
        ...value,
        cachedAt: Date.now(),
    });
};

export const clearPageCache = (keyPrefix = "") => {
    for (const key of pageCache.keys()) {
        if (!keyPrefix || key.startsWith(keyPrefix)) {
            pageCache.delete(key);
        }
    }
};
