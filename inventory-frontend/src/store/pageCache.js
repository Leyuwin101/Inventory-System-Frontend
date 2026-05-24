const pageCache = new Map();
const STORAGE_PREFIX = "ims:page-cache:";
const DEFAULT_TTL = 15 * 60_000;

const canUseStorage = () => typeof window !== "undefined" && window.sessionStorage;

export const getPageCache = (key, { ttl = DEFAULT_TTL } = {}) => {
    const cached = pageCache.get(key);
    if (cached) {
        if (!ttl || Date.now() - cached.cachedAt <= ttl) return cached;
        pageCache.delete(key);
    }

    if (!canUseStorage()) return undefined;

    try {
        const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (!stored) return undefined;

        const parsed = JSON.parse(stored);
        if (ttl && Date.now() - parsed.cachedAt > ttl) {
            window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
            return undefined;
        }
        pageCache.set(key, parsed);
        return parsed;
    } catch {
        return undefined;
    }
};

export const setPageCache = (key, value) => {
    const entry = {
        ...value,
        cachedAt: Date.now(),
    };

    pageCache.set(key, entry);

    if (canUseStorage()) {
        try {
            window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
        } catch {
            // Page cache is an optimization only.
        }
    }
};

export const clearPageCache = (keyPrefix = "") => {
    for (const key of pageCache.keys()) {
        if (!keyPrefix || key.startsWith(keyPrefix)) {
            pageCache.delete(key);
        }
    }

    if (canUseStorage()) {
        for (const key of Object.keys(window.sessionStorage)) {
            if (key.startsWith(STORAGE_PREFIX)) {
                const cacheKey = key.slice(STORAGE_PREFIX.length);
                if (!keyPrefix || cacheKey.startsWith(keyPrefix)) {
                    window.sessionStorage.removeItem(key);
                }
            }
        }
    }
};
