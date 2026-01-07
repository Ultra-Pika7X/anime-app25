import { NextResponse } from 'next/server';
import { scraper } from '@/lib/scraper';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // AniList ID
    const episode = searchParams.get('episode'); // Episode Number
    const providerPref = searchParams.get('provider'); // Optional provider preference

    if (!id || !episode) {
        return NextResponse.json({ error: 'Missing ID or Episode' }, { status: 400 });
    }

    try {
        // 1. Fetch Anime Info (Title) from Jikan/AniList to search
        const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
        const jikanData = await jikanRes.json();
        const title = jikanData.data?.title_english || jikanData.data?.title;

        if (!title) {
            return NextResponse.json({ error: 'Could not resolve anime title' }, { status: 404 });
        }

        console.log(`[API] Fetching sources for: ${title} Episode ${episode}`);

        // 2. Use unified scraper to get validated streams
        const sources = await scraper.getStreams(id, Number(episode), title, providerPref || undefined);

        if (sources.length === 0) {
            return NextResponse.json({
                error: "No compatible streams found",
                message: "All available sources were either unavailable or used incompatible iframe players."
            }, { status: 404 });
        }

        // 3. Extract the provider used (from first source)
        const usedProvider = sources[0].provider;

        return NextResponse.json({
            sources,
            provider: usedProvider,
            title: title
        });

    } catch (e: any) {
        console.error("[API Error] Source Route:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
