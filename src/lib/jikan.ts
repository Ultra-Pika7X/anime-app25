import { MediaRow } from "@/components/common/MediaRow";

const BASE_URL = "https://api.jikan.moe/v4";

// Rate limiting handling could be improved, but Jikan is generous.
// We'll add a small delay if needed or handle 429s.

async function fetchJikan(endpoint: string, params: Record<string, string> = {}) {
    const queryParams = new URLSearchParams(params);
    const url = `${BASE_URL}${endpoint}?${queryParams.toString()}`;

    const res = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
        if (res.status === 429) {
            // Simple backoff could go here, but for now just log and return empty
            console.warn("Jikan API Rate-limited");
            return null;
        }
        throw new Error(`Jikan Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

// Mapper to convert Jikan anime object to our app's Movie/TV structure
function mapAnimeToMedia(anime: any): any {
    if (!anime) return null;
    return {
        id: anime.mal_id,
        title: anime.title,
        name: anime.title, // Support both naming conventions
        original_name: anime.title_japanese,
        overview: anime.synopsis,
        poster_path: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        // Use trailer thumbnail as backdrop, or fallback to poster
        backdrop_path: anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.large_image_url,
        media_type: "movie", // Default to movie, but we can refine
        vote_average: anime.score,
        vote_count: anime.scored_by,
        release_date: anime.aired?.from ? anime.aired.from.split("T")[0] : null,
        first_air_date: anime.aired?.from ? anime.aired.from.split("T")[0] : null,
        popularity: anime.popularity,
    };
}

export const jikan = {
    getTrendingAnime: async (type: "movie" | "tv" = "movie", page = 1) => {
        try {
            // 'top/anime' with filter usually works well for trending/popular
            // filter: "airing" for trending TV, "bypopularity" generally
            const filter = type === 'tv' ? 'airing' : 'bypopularity';
            // Jikan doesn't distinguish movie/tv in the same way, but we can filter by type
            const typeParam = type === 'tv' ? 'tv' : 'movie';

            const data = await fetchJikan("/top/anime", {
                page: page.toString(),
                filter: filter,
                type: typeParam
            });
            return { results: data?.data?.map(mapAnimeToMedia) || [] };
        } catch (e) {
            console.error("Jikan getTrending error:", e);
            return { results: [] };
        }
    },

    getPopularAnime: async (type: "movie" | "tv" = "movie", page = 1) => {
        try {
            const typeParam = type === 'tv' ? 'tv' : 'movie';
            const data = await fetchJikan("/top/anime", {
                page: page.toString(),
                filter: "bypopularity",
                type: typeParam
            });
            return { results: data?.data?.map(mapAnimeToMedia) || [] };
        } catch (e) {
            console.error("Jikan getPopular error:", e);
            return { results: [] };
        }
    },

    getTopRatedAnime: async (type: "movie" | "tv" = "movie", page = 1) => {
        try {
            const typeParam = type === 'tv' ? 'tv' : 'movie';
            const data = await fetchJikan("/top/anime", {
                page: page.toString(),
                filter: "favorite",
                type: typeParam
            });
            return { results: data?.data?.map(mapAnimeToMedia) || [] };
        } catch (e) {
            console.error("Jikan getTopRated error:", e);
            return { results: [] };
        }
    },

    searchAnime: async (query: string, page = 1) => {
        try {
            const data = await fetchJikan("/anime", { q: query, page: page.toString() });
            return { results: data?.data?.map(mapAnimeToMedia) || [] };
        } catch (e) {
            console.error("Jikan search error:", e);
            return { results: [] };
        }
    },

    getAnimeDetails: async (id: string | number) => {
        try {
            const { data } = await fetchJikan(`/anime/${id}`);
            const mapped = mapAnimeToMedia(data);
            if (!mapped) return null;

            // Fetch recommendations if possible (requires separate call in v4)
            // We can implement this later or do a parallel call here

            return {
                ...mapped,
                genres: data.genres?.map((g: any) => ({ id: g.mal_id, name: g.name })) || [],
                recommendations: { results: [] } // TODO: Implement recommendations
            };
        } catch (e) {
            console.error("Jikan details error:", e);
            return null;
        }
    },
    getAnimeImage: async (id: string | number) => {
        try {
            const { data } = await fetchJikan(`/anime/${id}`);
            return data?.images?.jpg?.large_image_url || data?.images?.jpg?.image_url || null;
        } catch (e) {
            console.error("Jikan image fetch error:", e);
            return null;
        }
    },
};
