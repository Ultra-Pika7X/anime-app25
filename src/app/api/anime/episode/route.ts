
import { NextResponse } from 'next/server';
import { ANIME } from '@consumet/extensions';

// Initialize AnimePahe
const animepahe = new ANIME.AnimePahe();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // MAL ID

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {
        // 1. Get Title from Jikan (MAL API)
        // We need the title to search on AnimePahe
        const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
        if (!jikanRes.ok) {
            throw new Error("Failed to fetch anime info from Jikan");
        }
        const jikanData = await jikanRes.json();
        const title = jikanData.data.title_english || jikanData.data.title; // Prefer English, fallback to default

        if (!title) {
            throw new Error("Could not determine anime title");
        }

        console.log(`Searching AnimePahe for: ${title}`);

        // 2. Search AnimePahe
        const searchRes = await animepahe.search(title);

        if (!searchRes.results || searchRes.results.length === 0) {
            return NextResponse.json({ error: 'Anime not found on AnimePahe' }, { status: 404 });
        }

        // Simple matching: take the first one. 
        // In a more complex app, we might compare release dates or fuzzy match titles.
        const bestMatch = searchRes.results[0];

        // 3. Fetch Info & Episodes
        const info = await animepahe.fetchAnimeInfo(bestMatch.id);

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
