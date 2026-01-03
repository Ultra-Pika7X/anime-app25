
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimePlayer } from "@/components/player/AnimePlayer";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EpisodeData {
    sources: { url: string; isM3U8: boolean; quality?: string }[];
    skipTimes?: {
        found: boolean;
        results: {
            interval: { startTime: number; endTime: number };
            skipType: "op" | "ed";
        }[];
    };
}

export default function WatchPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string; // TMDB/MAL ID (Assuming simple pass-through for now)
    const epNum = params.episode as string;

    // We need an "episodeId" for the provider (e.g. gogoanime). 
    // Since our route structure is /watch/[id]/[episode], we first need to fetch the EPISODE LIST
    // to find the provider's specific ID for this episode number.

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [streamData, setStreamData] = useState<EpisodeData | null>(null);
    const [epList, setEpList] = useState<any[]>([]);

    useEffect(() => {
        async function loadContent() {
            setLoading(true);
            setError("");
            try {
                // 1. Fetch Episode List to map "Episode 1" -> "anime-name-episode-1"
                const listRes = await fetch(`/api/anime/episode?id=${id}`);
                const listData = await listRes.json();

                if (!listData.episodes || listData.episodes.length === 0) {
                    throw new Error("No episodes found for this anime.");
                }

                setEpList(listData.episodes);

                // Find the correct episode object
                const targetEp = listData.episodes.find((e: any) => e.number == epNum);

                if (!targetEp) {
                    throw new Error(`Episode ${epNum} not found.`);
                }

                // 2. Fetch Stream Data using the Provider Episode ID
                // If it's a fallback ID (starts with "fallback-"), skip fetching source because we know it doesn't exist on provider
                if (targetEp.id.toString().startsWith("fallback-")) {
                    console.log("Using Fallback Episode ID, skipping source fetch.");
                    setStreamData(null); // This will cause source used in AnimePlayer to be null -> triggers iframe
                } else {
                    const sourceRes = await fetch(`/api/anime/source?episodeId=${targetEp.id}&malId=${id}&epNum=${epNum}`);
                    const sourceData = await sourceRes.json();

                    if (sourceData.error) {
                        console.warn("Source fetch failed, reverting to fallback iframe:", sourceData.error);
                        setStreamData(null);
                    } else {
                        setStreamData({
                            sources: sourceData.sources.sources,
                            skipTimes: sourceData.skipTimes
                        });
                    }
                }

            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load episode.");
            } finally {
                setLoading(false);
            }
        }

        if (id && epNum) {
            loadContent();
        }
    }, [id, epNum]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // If error is critical (no list found), show error. 
    // But usually loadContent catches fetch errors.

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-black gap-4 text-center px-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <h1 className="text-2xl font-bold text-white">Playback Error</h1>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
        );
    }

    // Extract HLS Source
    const hlsSource = streamData?.sources?.find(s => s.quality === "default" || s.quality === "auto")?.url
        || streamData?.sources?.[0]?.url
        || null;

    // Extract Skip Times
    const op = streamData?.skipTimes?.results.find(r => r.skipType === "op")?.interval;
    const ed = streamData?.skipTimes?.results.find(r => r.skipType === "ed")?.interval;

    return (
        <div className="min-h-screen bg-black pt-20 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Player Container */}
                <AnimePlayer
                    source={hlsSource}
                    intro={op ? { start: op.startTime, end: op.endTime } : undefined}
                    outro={ed ? { start: ed.startTime, end: ed.endTime } : undefined}
                    autoPlay
                    malId={id}
                    episodeNumber={epNum}
                />

                {/* Episode Info / Navigation (Basic) */}
                <div className="flex justify-between items-center text-white">
                    <div>
                        <h1 className="text-2xl font-bold">Episode {epNum}</h1>
                    </div>
                    {/* TODO: Next/Prev Buttons */}
                </div>

            </div>
        </div>
    );
}
