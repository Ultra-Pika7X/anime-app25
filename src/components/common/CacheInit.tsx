"use client";

import { useEffect } from "react";
import { cache } from "@/lib/cache";

/**
 * Initializes cache cleanup on app load
 * Runs once when the app first loads
 */
export function CacheInit() {
    useEffect(() => {
        // Clear expired entries on app load
        cache.clearExpired();

        // Log cache size for debugging
        const size = cache.getSize();
        if (size > 0) {
            console.log(`Cache size: ${size}KB`);
        }

        // Set up periodic cleanup (every 5 minutes)
        const interval = setInterval(() => {
            cache.clearExpired();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return null;
}
