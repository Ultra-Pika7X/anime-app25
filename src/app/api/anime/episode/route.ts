
import { NextResponse } from 'next/server';
import { AnimePahe } from '@/lib/AnimePahe';

const animepahe = new AnimePahe();

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
        const title = jikanData.data.title_english || jikanData.data.title;

        if (!title) {
            throw new Error("Could not determine anime title");
        }

        console.log(`Searching Custom AnimePahe for: ${title}`);

        // 2. Search AnimePahe
        const searchRes = await animepahe.search(title);

        if (!searchRes.results || searchRes.results.length === 0) {
            return NextResponse.json({ error: 'Anime not found on AnimePahe' }, { status: 404 });
        }

        const bestMatch = searchRes.results[0];

        // 3. Fetch Info & Episodes
        // bestMatch.id is the AnimePahe ID (confusingly passed as string)
        const info = await animepahe.fetchAnimeInfo(bestMatch.id);

        return NextResponse.json({
            episodes: info.episodes,
            title: title,
            image: bestMatch.image,
            description: jikanData.data.synopsis
        });

    } catch (error: any) {
        console.error('Episode fetch error (Internal):', error.message);

        // Fallback: Use Jikan to get episode list so UI at least loads
        try {
            console.log("Attempting Jikan Fallback for episodes...");
            const jikanEpRes = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`);
            if (jikanEpRes.ok) {
                const jikanEpData = await jikanEpRes.json();
                const fallbackEpisodes = jikanEpData.data.map((ep: any) => ({
                    id: `fallback-${ep.mal_id}`,
                    number: ep.mal_id,
                    title: ep.title,
                    image: null
                }));
                // We need to refetch title/image if we didn't get it earlier (but we usually do)
                // If jikanData was fetched earlier, we have it. If not, fetch it now.
                // Actually, we fetched jikanData at line 18.

                // If we crash before line 18? No, the try block starts after. 
                // We need to ensure we return title/image too.

                // Re-fetch info if needed or use what we have? 
                // To be safe, let's just return what we have or a placeholder.

                return NextResponse.json({
                    episodes: fallbackEpisodes,
                    title: "Anime (Fallback)", // Or use cached?
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
