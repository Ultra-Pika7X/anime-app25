"use client";

/**
 * Smart Source Memory System
 * Tracks which streaming sources work best for each anime
 */

export interface SourceStats {
    provider: string;
    successCount: number;
    lastUsed: number;
}

export interface AnimeSourceMemory {
    animeId: string;
    lastSuccessful: string | null;
    sources: SourceStats[];
}

const STORAGE_KEY = "anime_source_memory";

/**
 * Get all source memory data
 */
function getAllMemory(): Record<string, AnimeSourceMemory> {
    if (typeof window === 'undefined') return {};
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

/**
 * Save all source memory data
 */
function saveAllMemory(data: Record<string, AnimeSourceMemory>): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save source memory", e);
    }
}

/**
 * Get memory for a specific anime
 */
export function getAnimeSourceMemory(animeId: string): AnimeSourceMemory | null {
    const all = getAllMemory();
    return all[animeId] || null;
}

/**
 * Get the recommended source for an anime (last successful + highest success count)
 */
export function getRecommendedSource(animeId: string): string | null {
    const memory = getAnimeSourceMemory(animeId);
    if (!memory) return null;

    // Return the last successful source
    return memory.lastSuccessful;
}

/**
 * Get source stats sorted by success (for display)
 */
export function getSourceRanking(animeId: string): SourceStats[] {
    const memory = getAnimeSourceMemory(animeId);
    if (!memory) return [];

    // Sort by success count (descending), then by last used (recent first)
    return [...memory.sources].sort((a, b) => {
        if (b.successCount !== a.successCount) {
            return b.successCount - a.successCount;
        }
        return b.lastUsed - a.lastUsed;
    });
}

/**
 * Record a successful source play
 */
export function recordSourceSuccess(animeId: string, provider: string): void {
    const all = getAllMemory();

    if (!all[animeId]) {
        all[animeId] = {
            animeId,
            lastSuccessful: provider,
            sources: []
        };
    }

    const memory = all[animeId];
    memory.lastSuccessful = provider;

    // Find or create source stats
    const existing = memory.sources.find(s => s.provider === provider);
    if (existing) {
        existing.successCount++;
        existing.lastUsed = Date.now();
    } else {
        memory.sources.push({
            provider,
            successCount: 1,
            lastUsed: Date.now()
        });
    }

    saveAllMemory(all);
}

/**
 * Record a failed source attempt (optional, for analytics)
 */
export function recordSourceFailure(animeId: string, provider: string): void {
    // For now, we don't decrement success count
    // But this could be used for more advanced analytics
    console.log(`Source failed for ${animeId}: ${provider}`);
}

/**
 * Sort sources array to prioritize recommended source
 */
export function sortSourcesByRecommendation<T extends { provider?: string; quality?: string }>(
    animeId: string,
    sources: T[]
): T[] {
    const recommended = getRecommendedSource(animeId);
    const ranking = getSourceRanking(animeId);

    if (!recommended && ranking.length === 0) {
        return sources; // No history, return as-is
    }

    return [...sources].sort((a, b) => {
        const provA = a.provider || extractProvider(a.quality);
        const provB = b.provider || extractProvider(b.quality);

        // 1. Last successful source first
        if (provA === recommended && provB !== recommended) return -1;
        if (provB === recommended && provA !== recommended) return 1;

        // 2. Sort by historical success count
        const rankA = ranking.findIndex(r => r.provider === provA);
        const rankB = ranking.findIndex(r => r.provider === provB);

        // If in ranking, use that order
        if (rankA >= 0 && rankB >= 0) return rankA - rankB;
        if (rankA >= 0) return -1;
        if (rankB >= 0) return 1;

        return 0; // Keep original order
    });
}

/**
 * Extract provider name from quality string (e.g., "1080p (AnimePahe)" -> "AnimePahe")
 */
function extractProvider(quality?: string): string | null {
    if (!quality) return null;
    const match = quality.match(/\(([^)]+)\)/);
    return match ? match[1] : null;
}

/**
 * Clear all source memory (for settings/debug)
 */
export function clearSourceMemory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get stats summary for display
 */
export function getSourceMemorySummary(animeId: string): {
    recommended: string | null;
    totalPlays: number;
    sources: SourceStats[];
} {
    const memory = getAnimeSourceMemory(animeId);
    if (!memory) {
        return { recommended: null, totalPlays: 0, sources: [] };
    }

    const totalPlays = memory.sources.reduce((sum, s) => sum + s.successCount, 0);

    return {
        recommended: memory.lastSuccessful,
        totalPlays,
        sources: getSourceRanking(animeId)
    };
}
