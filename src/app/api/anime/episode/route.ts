
import { NextResponse } from 'next/server';
import { ANIME } from '@consumet/extensions';

// Use Gogoanime as primary
const gogoanime = new ANIME.Gogoanime();

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

        console.log(`Searching Gogoanime for: ${title}`);

        // 2. Search Gogoanime
        const searchRes = await gogoanime.search(title);

        if (!searchRes.results || searchRes.results.length === 0) {
            return NextResponse.json({ error: 'Anime not found on Gogoanime' }, { status: 404 });
        }

        const bestMatch = searchRes.results[0];

        // 3. Fetch Info & Episodes
        const info = await gogoanime.fetchAnimeInfo(bestMatch.id);

        return NextResponse.json({
            episodes: info.episodes,
            title: title,
            image: bestMatch.image,
            description: jikanData.data.synopsis
        });

    } catch (error: any) {
        console.error('Episode fetch error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch episodes' }, { status: 500 });
    }
}
