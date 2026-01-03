
import { NextResponse } from 'next/server';
import { ANIME, META } from '@consumet/extensions';

const gogoanime = new ANIME.Gogoanime();
const anilist = new META.Anilist();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episodeId');
    const malId = searchParams.get('malId');
    const epNum = searchParams.get('epNum');

    if (!episodeId) {
        return NextResponse.json({ error: 'Missing episodeId' }, { status: 400 });
    }

    try {
        // 1. Fetch Stream Sources
        const sources = await anilist.fetchEpisodeSources(episodeId);

        // 2. Fetch AniSkip Data (Skip Intro/Outro)
        let skipTimes = null;
        if (malId && epNum) {
            try {
                const aniSkipRes = await fetch(`https://api.aniskip.com/v2/skip-times/${malId}/${epNum}?types[]=op&types[]=ed&episodeLength=0`);
                if (aniSkipRes.ok) {
                    skipTimes = await aniSkipRes.json();
                }
            } catch (e) {
                console.warn("AniSkip fetch failed:", e);
            }
        }

        return NextResponse.json({
            sources,
            skipTimes
        });

    } catch (error: any) {
        console.error('Source fetch error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch sources' }, { status: 500 });
    }
}
