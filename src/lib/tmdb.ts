import { jikan } from "./jikan";

export type MediaType = "movie" | "tv";

/**
 * Metadata provider that now uses Jikan (MyAnimeList) API to enforce Anime-only content.
 * We keep the "tmdb" object name to avoid breaking imports in the rest of the app.
 */
export const tmdb = {
    getTrending: async (type: MediaType, page = 1) => {
        return jikan.getTrendingAnime(type, page);
    },

    getTopRated: async (type: MediaType, page = 1) => {
        return jikan.getTopRatedAnime(type, page);
    },

    getPopular: async (type: MediaType, page = 1) => {
        return jikan.getPopularAnime(type, page);
    },

    getDetails: async (type: MediaType, id: string | number) => {
        return jikan.getAnimeDetails(id);
    },

    search: async (query: string, page = 1) => {
        return jikan.searchAnime(query, page);
    },
};
