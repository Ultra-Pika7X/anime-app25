
"use client";

/**
 * Skip Cache System
 * Stores and retrieves skip timestamps (Intro/Outro) per anime/episode.
 * Prioritizes MANUAL overrides over AUTOMATIC (AniSkip) results.
 */

export interface SkipTime {
    start: number;
    end: number;
}

export interface EpisodeSkipData {
    intro?: SkipTime;
    outro?: SkipTime;
    lastUpdated: number;
    isManual?: boolean; // If true, never overwrite with API data
}

export interface AnimeSkipCache {
    [episodeNumber: string]: EpisodeSkipData;
}

const STORAGE_KEY = "anime_skip_cache_v1";

/**
 * Get all skip cache
 */
function getCache(): Record<string, AnimeSkipCache> {
    if (typeof window === 'undefined') return {};
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

/**
 * Save cache
 */
function saveCache(data: Record<string, AnimeSkipCache>) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save skip cache", e);
    }
}

/**
 * Get skip data for a specific episode
 */
export function getSkipData(malId: string, episode: number): EpisodeSkipData | null {
    const cache = getCache();
    if (!cache[malId]) return null;
    return cache[malId][episode.toString()] || null;
}

/**
 * Save skip data (Merged with existing)
 */
export function saveSkipData(malId: string, episode: number, data: Partial<EpisodeSkipData>, isManual: boolean = false) {
    const all = getCache();
    if (!all[malId]) all[malId] = {};

    const existing = all[malId][episode.toString()] || {};

    // Safety check: Don't overwrite Manual data with Auto data
    if (existing.isManual && !isManual) {
        return; // Ignore API update if user set manual overrides
    }

    all[malId][episode.toString()] = {
        ...existing,
        ...data,
        lastUpdated: Date.now(),
        isManual: isManual || existing.isManual // Preserve manual flag
    };

    saveCache(all);
}

/**
 * Clear manual overrides for an episode (Reset to API)
 */
export function clearManualSkip(malId: string, episode: number) {
    const all = getCache();
    if (!all[malId] || !all[malId][episode.toString()]) return;

    // Reset manual flag, but keep timestamps until next API fetch overwrites them (or just delete?)
    // Better to delete so next fetch gets fresh data
    delete all[malId][episode.toString()];
    saveCache(all);
}
