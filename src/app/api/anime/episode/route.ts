
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

        let episodes: any[] = [];
        let provider = "";
        let animeImage = "";
        let usedTitle = "";

        // Strategy: Iterate through ALL titles until we find a match
        for (const searchTitle of titleList) {
            if (episodes.length > 0) break; // Found it!

            // 2. Try AnimePahe (Better Quality)
            try {
                // console.log(`Trying AnimePahe with: "${searchTitle}"`);
                const paheRes = await animepahe.search(searchTitle);

                if (paheRes.results.length > 0) {
                    const bestMatch = paheRes.results[0];
                    const info = await animepahe.fetchAnimeInfo(bestMatch.id);
                    if (info.episodes && info.episodes.length > 0) {
                        episodes = info.episodes.map((ep: any) => ({
                            ...ep,
                            id: `pahe:${ep.id}` // Prefix ID
                        }));
                        animeImage = bestMatch.image;
                        provider = "AnimePahe";
                        usedTitle = searchTitle;
                        console.log(`FOUND on AnimePahe using title: "${searchTitle}"`);
                        break;
                    }
                }
            } catch (e) {
                // console.warn(`AnimePahe failed for "${searchTitle}"`);
            }

            // 3. Try Gogoanime (Larger Library)
            if (episodes.length === 0) {
                try {
                    // console.log(`Trying Gogoanime with: "${searchTitle}"`);
                    const gogoRes = await gogoanime.search(searchTitle);

                    if (gogoRes.results.length > 0) {
                        const bestMatch = gogoRes.results[0];
                        const info = await gogoanime.fetchAnimeInfo(bestMatch.id);
                        if (info && info.episodes && info.episodes.length > 0) {
                            episodes = info.episodes.map((ep: any) => ({
                                ...ep,
                                id: `gogo:${ep.id}` // Prefix ID
                            }));
                            animeImage = bestMatch.image || animeImage;
                            provider = "Gogoanime";
                            usedTitle = searchTitle;
                            console.log(`FOUND on Gogoanime using title: "${searchTitle}"`);
                            break;
                        }
                    }
                } catch (e) {
                    // console.warn(`Gogoanime failed for "${searchTitle}"`);
                }
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
            description: jikanData.data.synopsis,
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
