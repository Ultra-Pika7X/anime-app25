
import { NextResponse } from 'next/server';
import { ANIME, META } from '@consumet/extensions';

// Initialize providers
const hianime = new ANIME.Hianime();
// Fallback could be Anilist (META) which aggregates
const anilist = new META.Anilist();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // MAL ID or Anime ID
    const provider = searchParams.get('provider') || 'gogoanime';

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {
        let episodes: any[] = [];
        let info: any = {};

        // Strategy: 
        // 1. Try to find the anime on the provider using the MAL ID directly (rarely works directly for Gogo)
        // 2. Search for the anime title (we might need to fetch title first if only ID is provided)
        // 3. Or use Consumet's Meta provider (Anilist) which maps MAL ID to providers

        // Approach using Anilist Meta provider (best for mapping)
        try {
            const animeInfo = await anilist.fetchAnimeInfo(id);
            if (animeInfo.episodes) {
                episodes = animeInfo.episodes;
                info = animeInfo;
            }
        } catch (err) {
            console.error("Anilist fetch failed, trying Search fallback", err);
            // Fallback: This would require title, which we don't have if only ID passed. 
            // In a real app, we'd fetch info from Jikan first to get title, then search.
        }

        return NextResponse.json({
            episodes,
            title: info.title,
            image: info.image,
            description: info.description
        });

    } catch (error: any) {
        console.error('Episode fetch error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch episodes' }, { status: 500 });
    }
}
