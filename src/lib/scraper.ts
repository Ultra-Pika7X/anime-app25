import { AnimePahe } from './AnimePahe';
import { Gogoanime } from './Gogoanime';
import { HiAnime } from './HiAnime';
import { AllAnime } from './AllAnime';
import { AnimeFox } from './AnimeFox';
import { KickAssAnime } from './KickAssAnime';
import { calculateLevenshteinSimilarity } from './levenshtein';
import { getRecommendedSource, getSourceRanking } from './sourceMemory';
import { StreamGuard } from './streamGuard';

const animepahe = new AnimePahe();
const gogoanime = new Gogoanime();
const hianime = new HiAnime();
const allanime = new AllAnime();
const animefox = new AnimeFox();
const kaa = new KickAssAnime();

export interface StreamSource {
    url: string;
    quality: string;
    isM3U8: boolean;
    provider?: string;
}

export interface Episode {
    id: string;
    number: number;
    title?: string;
    image?: string;
    description?: string;
    isFiller?: boolean;
}

export const scraper = {
    async getStreams(malId: string, episodeNumber: number, titleArg?: string, providerPref?: string): Promise<StreamSource[]> {
        let title = (titleArg || "").split(' (')[0].split(' - ')[0].trim();

        // Ensure we have a title to search with
        if (!title) {
            try {
                const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
                const jikanData = await jikanRes.json();
                title = jikanData.data?.title_english || jikanData.data?.title;
                if (title) title = title.split(' (')[0].split(' - ')[0].trim();
            } catch (err) {
                console.error("[Scraper] Failed to resolve title for MAL ID:", malId);
            }
        }

        if (!title) return [];

        const providers = [
            {
                name: "HiAnime",
                fn: async () => {
                    const search = await hianime.search(title);
                    // Use new fuzzy matching (0.6 threshold)
                    const best = search.results.find(r => calculateLevenshteinSimilarity(r.title, title) >= 0.6) || search.results[0];
                    if (best) {
                        const info = await hianime.fetchAnimeInfo(best.id);
                        const ep = info.episodes.find((e: any) => e.number === episodeNumber);
                        if (ep) return await hianime.fetchEpisodeSources(ep.id);
                    }
                    return null;
                }
            },
            {
                name: "AnimePahe",
                fn: async () => {
                    const search = await animepahe.search(title);
                    const best = search.results.find((r: any) => calculateLevenshteinSimilarity(r.title, title) >= 0.6) || search.results[0];
                    if (best) {
                        const info = await animepahe.fetchAnimeInfo(best.id);
                        const ep = info.episodes.find((e: any) => e.number === episodeNumber);
                        if (ep) return await animepahe.fetchEpisodeSources(ep.id);
                    }
                    return null;
                }
            },
            {
                name: "AllAnime",
                fn: async () => {
                    try {
                        const search = await allanime.search(title);
                        const best = search.results.find((r: any) => calculateLevenshteinSimilarity(r.title, title) >= 0.6) || search.results[0];
                        if (best) {
                            const info = await allanime.fetchAnimeInfo(best.id);
                            if (!info) return null;
                            const ep = info.episodes.find((e: any) => e.number === episodeNumber);
                            if (ep) return await allanime.fetchEpisodeSources(ep.id);
                        }
                    } catch (e) { console.warn("AllAnime failed", e); }
                    return null;
                }
            },
            {
                name: "Gogoanime",
                fn: async () => {
                    const search = await gogoanime.search(title);
                    const best = search.results.find((r: any) => calculateLevenshteinSimilarity(r.title, title) >= 0.6) || search.results[0];
                    if (best) {
                        const info = await gogoanime.fetchAnimeInfo(best.id);
                        if (!info) return null;
                        const ep = info.episodes.find((e: any) => e.number === episodeNumber);
                        if (ep) return await gogoanime.fetchEpisodeSources(ep.id);
                    }
                    return null;
                }
            },
            {
                name: "AnimeFox",
                fn: async () => {
                    try {
                        const search = await animefox.search(title);
                        const best = search.results.find((r: any) => calculateLevenshteinSimilarity(r.title, title) >= 0.6) || search.results[0];
                        if (best) {
                            const info = await animefox.fetchAnimeInfo(best.id);
                            if (!info) return null;
                            const ep = info.episodes.find((e: any) => e.number === episodeNumber);
                            if (ep) return await animefox.fetchEpisodeSources(ep.id);
                        }
                    } catch (e) { console.warn("AnimeFox failed", e); }
                    return null;
                }
            },
            {
                name: "KickAssAnime",
                fn: async () => {
                    try {
                        const search = await kaa.search(title);
                        const best = search.results.find((r: any) => calculateLevenshteinSimilarity(r.title, title) >= 0.8) || search.results[0];
                        if (best) {
                            const info = await kaa.fetchAnimeInfo(best.id);
                            if (!info) return null;
                            const ep = info.episodes.find((e: any) => e.number === episodeNumber);
                            if (ep) return await kaa.fetchEpisodeSources(ep.id);
                        }
                    } catch (e) { console.warn("KickAssAnime failed", e); }
                    return null;
                }
            }
        ];


        // INTELLIGENT SORTING
        // 1. User Preference
        // 2. Last Successful Source (from memory)
        // 3. Historical Success Rate (from memory)

        const recommended = getRecommendedSource(malId); // ID used for memory tracking
        const ranking = getSourceRanking(malId);

        providers.sort((a, b) => {
            // 1. User Preference
            if (providerPref) {
                if (a.name === providerPref) return -1;
                if (b.name === providerPref) return 1;
            }

            // 2. Last Successful
            if (recommended) {
                if (a.name === recommended) return -1;
                if (b.name === recommended) return 1;
            }

            // 3. Historical Success Rate
            const rankA = ranking.findIndex(r => r.provider === a.name);
            const rankB = ranking.findIndex(r => r.provider === b.name);

            // If both present, higher rank (lower index) wins
            if (rankA !== -1 && rankB !== -1) return rankA - rankB;
            // If one present, it wins
            if (rankA !== -1) return -1;
            if (rankB !== -1) return 1;

            return 0;
        });

        // PARALLEL FETCHING WITH RACE
        // We will start all providers, but resolve as soon as we find GOOD sources.
        // We also set a timeout for the entire operation.

        const fetchWithTimeout = async (prov: any) => {
            try {
                // console.log(`[Scraper] Starting ${prov.name}`);
                const start = Date.now();
                const res = await prov.fn();
                const duration = Date.now() - start;

                if (res && res.sources && res.sources.length > 0) {
                    const validSources = res.sources.filter((s: any) => {
                        const validation = StreamGuard.validate(s.url, s.isM3U8 || s.url.includes('.m3u8'));
                        if (!validation.valid) {
                            // console.log(`[StreamGuard] Blocked ${prov.name} source: ${validation.reason} (${s.url})`);
                        }
                        return validation.valid;
                    }).map((s: any) => ({
                        url: s.url,
                        quality: s.quality || 'Auto',
                        isM3U8: s.isM3U8 || s.url.includes('.m3u8'),
                        provider: prov.name
                    }));

                    if (validSources.length > 0) {
                        // console.log(`[Scraper] ${prov.name} finished in ${duration}ms with ${validSources.length} sources`);
                        return validSources;
                    }
                }
            } catch (err) {
                // console.warn(`[Scraper] ${prov.name} failed`);
            }
            return null;
        };

        // We use a custom Promise implementation to "race" for success
        // but not fail if the first one fails.
        return new Promise<StreamSource[]>((resolve) => {
            let activeProviders = providers.length;
            let solved = false;
            const allSources: StreamSource[] = [];

            // If no providers, resolve immediately
            if (activeProviders === 0) resolve([]);

            providers.forEach(p => {
                fetchWithTimeout(p).then(res => {
                    if (solved) return; // Already finished

                    if (res && res.length > 0) {
                        // WE FOUND A WINNER!
                        solved = true;
                        resolve(res);
                    } else {
                        // This provider failed
                        activeProviders--;
                        if (activeProviders === 0) {
                            // All failed
                            resolve([]);
                        }
                    }
                });
            });

            // Global Timeout (e.g., 10 seconds)
            setTimeout(() => {
                if (!solved) {
                    console.log("[Scraper] Timeout reached, returning empty");
                    solved = true;
                    resolve([]);
                }
            }, 15000);
        });
    },
    async getEpisodes(malId: string, providerPref?: string, titleArg?: string): Promise<Episode[]> {
        let title = (titleArg || "").split(' (')[0].split(' - ')[0].trim();

        if (!title && malId) {
            try {
                const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
                const jikanData = await jikanRes.json();
                title = jikanData.data?.title_english || jikanData.data?.title;
                if (title) title = title.split(' (')[0].split(' - ')[0].trim();
            } catch (e) {
                console.error("[Scraper] Failed to resolve title for episodes:", malId);
            }
        }

        if (!title) return [];

        const providers = [hianime, gogoanime, animepahe];

        for (const provider of providers) {
            try {
                const search = await provider.search(title);
                const best = search.results.find((r: any) => calculateLevenshteinSimilarity(r.title, title) >= 0.6) || search.results[0];
                if (best) {
                    const info = await provider.fetchAnimeInfo(best.id);
                    // @ts-ignore
                    if (info.episodes && info.episodes.length > 0) return info.episodes;
                }
            } catch (e) {
                // console.warn("[Scraper] Provider failed for episodes", e);
            }
        }

        return [];
    }
};
