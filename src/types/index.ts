export interface MediaItem {
    id: number;
    idMal?: number; // Optional mapping
    title: {
        romaji: string;
        english: string;
        native: string;
    };
    coverImage: {
        extraLarge: string;
        large: string;
        medium: string;
        color: string;
    };
    bannerImage?: string;
    description?: string;
    averageScore?: number;
    genres?: string[];
    type: 'ANIME' | 'MANGA';
    format?: string;
    status?: string;
    nextAiringEpisode?: {
        airingAt: number;
        timeUntilAiring: number;
        episode: number;
    };
    seasonYear?: number;
    episodes?: number;
    // Progress Tracking
    progress?: number; // Current time in seconds
    duration?: number; // Total duration in seconds
    watchedEpisode?: number; // Episode number
    timestamp?: number; // Last watched timestamp (Date.now())
}

export interface MediaResponse {
    page: number;
    results: MediaItem[];
    total_pages: number;
    total_results: number;
}
