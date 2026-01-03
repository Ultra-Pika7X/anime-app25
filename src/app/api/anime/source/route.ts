
import { NextResponse } from 'next/server';
import { AnimePahe } from '@/lib/AnimePahe';

const animepahe = new AnimePahe();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episodeId');
    const malId = searchParams.get('malId');
    const epNum = searchParams.get('epNum');

    if (!episodeId) {
        return NextResponse.json({ error: 'Missing episodeId' }, { status: 400 });
    }

    try {
        // 1. Fetch Stream Sources from Custom AnimePahe
        const sources = await animepahe.fetchEpisodeSources(episodeId);

        // 2. Fetch AniSkip Data
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
            sources: sources.sources, // My custom class returns { sources: [] }
            skipTimes
        });

    } catch (error: any) {
        console.error('Source fetch error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch sources' }, { status: 500 });
    }
}
