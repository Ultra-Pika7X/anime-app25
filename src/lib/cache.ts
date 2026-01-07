const PREFIX = "anime_cache_";

interface CacheItem<T> {
    data: T;
    expiry: number;
}

export const cache = {
    set: <T>(key: string, data: T, ttlSeconds: number = 3600) => {
        if (typeof window === "undefined") return;
        const item: CacheItem<T> = {
            data,
            expiry: Date.now() + ttlSeconds * 1000,
        };
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(item));
        } catch (e) {
            console.warn("Cache write failed (quota?)", e);
        }
    },

    get: <T>(key: string): T | null => {
        if (typeof window === "undefined") return null;
        const itemStr = localStorage.getItem(PREFIX + key);
        if (!itemStr) return null;

        try {
            const item: CacheItem<T> = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(PREFIX + key);
                return null;
            }
            return item.data;
        } catch (e) {
            return null;
        }
    },

    remove: (key: string) => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(PREFIX + key);
    },

    // Clear all expired cache entries
    clearExpired: () => {
        if (typeof window === "undefined") return;
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(PREFIX)) {
                try {
                    const itemStr = localStorage.getItem(key);
                    if (itemStr) {
                        const item = JSON.parse(itemStr);
                        if (Date.now() > item.expiry) {
                            keysToRemove.push(key);
                        }
                    }
                } catch { }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${keysToRemove.length} expired cache entries`);
    },

    // Get total cache size in KB
    getSize: (): number => {
        if (typeof window === "undefined") return 0;
        let total = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(PREFIX)) {
                const item = localStorage.getItem(key);
                if (item) total += item.length;
            }
        }

        return Math.round(total / 1024);
    }
};
