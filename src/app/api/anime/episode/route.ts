
import { NextResponse } from 'next/server';
import { AnimePahe } from '@/lib/AnimePahe';
import { Gogoanime } from '@/lib/Gogoanime';

const animepahe = new AnimePahe();
const gogoanime = new Gogoanime();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // MAL ID

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {

        // 1. Get Title from Jikan (MAL API)
        const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
        if (!jikanRes.ok) {
            throw new Error("Failed to fetch anime info from Jikan");
        }
        const jikanData = await jikanRes.json();

        // Initialize variables
        let episodes: any[] = [];
        let animeImage = jikanData.data.images?.jpg?.large_image_url || "";
        let provider = "";
        let usedTitle = "";
        const title = jikanData.data.title_english || jikanData.data.title || "Anime";

        // Collect all possible titles
        const titlesToTry = new Set<string>();

        // Add prioritized titles
        if (jikanData.data.title_english) titlesToTry.add(jikanData.data.title_english);
        if (jikanData.data.title) titlesToTry.add(jikanData.data.title);
        if (jikanData.data.title_japanese) titlesToTry.add(jikanData.data.title_japanese);

        // Add synonyms
        if (jikanData.data.title_synonyms && Array.isArray(jikanData.data.title_synonyms)) {
            jikanData.data.title_synonyms.forEach((t: string) => titlesToTry.add(t));
        }

        const titleList = Array.from(titlesToTry);
        console.log(`Searching Providers with titles: ${JSON.stringify(titleList)}`);

        const validProviders = [
            {
                name: "AnimePahe",
                fn: async (query: string) => {
                    // console.log(`Trying AnimePahe with: "${query}"`);
                    const res = await animepahe.search(query);
                    if (res.results.length > 0) {
                        const bestMatch = res.results[0];
                        const info = await animepahe.fetchAnimeInfo(bestMatch.id);
                        if (info && info.episodes && info.episodes.length > 0) {
                            return {
                                episodes: info.episodes.map((ep: any) => ({ ...ep, id: `pahe:${ep.id}` })),
                                image: bestMatch.image,
                                provider: "AnimePahe"
                            };
                        }
                    }
                    return null;
                }
            },
            {
                name: "Gogoanime",
                fn: async (query: string) => {
                    // console.log(`Trying Gogoanime with: "${query}"`);
                    const res = await gogoanime.search(query);
                    if (res.results.length > 0) {
                        const bestMatch = res.results[0];
                        const info = await gogoanime.fetchAnimeInfo(bestMatch.id);
                        if (info && info.episodes && info.episodes.length > 0) {
                            return {
                                episodes: info.episodes.map((ep: any) => ({ ...ep, id: `gogo:${ep.id}` })),
                                image: bestMatch.image,
                                provider: "Gogoanime"
                            };
                        }
                    }
                    return null;
                }
            }
        ];

        const preferred = searchParams.get('provider'); // "AnimePahe" | "Gogoanime"

        // Sort providers: preferred first
        if (preferred) {
            validProviders.sort((a, b) => {
                if (a.name === preferred) return -1;
                if (b.name === preferred) return 1;
                return 0;
            });
        }

        // Strategy: Iterate through ALL titles until we find a match
        // But we want to iterate Providers PER Title? Or Titles PER Provider?
        // Prioritize Title Match logic is usually safer (try exact title on all providers).
        // But code previously iterated Titles, then inside tried Pahe THEN Gogo.
        // So it prioritized Pahe for Title 1, then Gogo for Title 1.
        // That seems correct. We just want to swap Pahe/Gogo order.

        for (const searchTitle of titleList) {
            if (episodes.length > 0) break; // Found it!

            // Iterate ordered providers
            for (const prov of validProviders) {
                try {
                    const result = await prov.fn(searchTitle);
                    if (result) {
                        episodes = result.episodes;
                        animeImage = result.image || animeImage;
                        provider = result.provider;
                        usedTitle = searchTitle;
                        console.log(`FOUND on ${provider} using title: "${searchTitle}"`);
                        break; // Break provider loop
                    }
                } catch (e) { /* ignore */ }
            }
        }

        if (episodes.length === 0) {
            console.warn("Anime not found on any provider with any title.");
            throw new Error("Anime not found on any provider");
        }

        console.log(`Final Result: ${episodes.length} episodes via ${provider}`);

        return NextResponse.json({
            episodes: episodes,
            title: title,
            image: animeImage,
            description: jikanData.data.synopsis || "No description available.",
            provider
        });

    } catch (error: any) {
        console.error('Episode fetch error (Internal):', error.message);

        // Fallback: Use Jikan to get episode list so UI at least loads
        try {
            console.log("Attempting Jikan Fallback for episodes...");
            const jikanEpRes = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`);
            if (jikanEpRes.ok) {
                const jikanEpData = await jikanEpRes.json();
                let fallbackEpisodes = jikanEpData.data.map((ep: any) => ({
                    id: `fallback-${ep.mal_id}`,
                    number: ep.mal_id,
                    title: ep.title,
                    image: null
                }));

                // Fix for Movies: Jikan returns generic empty array for movies. 
                // We inject a dummy "Episode 1" so the user can at least try to watch it via fallback.
                if (fallbackEpisodes.length === 0) {
                    console.log("Jikan returned 0 episodes (likely Movie). Injecting default Episode 1.");
                    fallbackEpisodes = [{
                        id: `fallback-1`,
                        number: 1,
                        title: "Full Movie / Episode 1",
                        image: null
                    }];
                }

                return NextResponse.json({
                    episodes: fallbackEpisodes,
                    title: "Anime (Fallback)",
                    image: "",
                    description: "Loaded via Fallback",
                    isFallback: true
                });
            }
        } catch (fallbackErr) {
            console.error("Jikan Fallback Failed:", fallbackErr);
        }

        return NextResponse.json({ error: error.message || 'Failed to fetch episodes' }, { status: 500 });
    }
}
