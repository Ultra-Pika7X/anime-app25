export interface MediaItem {
    id: string | number;
    title?: string;
    name?: string; // For TV shows
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    media_type: "movie" | "tv" | "person";
    genres?: { name: string }[];
    runtime?: number;
}

export interface MediaResponse {
    page: number;
    results: MediaItem[];
    total_pages: number;
    total_results: number;
}
