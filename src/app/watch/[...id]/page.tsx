import { scraper } from "@/lib/scraper";

import { AnimePlayer } from "@/components/player/AnimePlayer";
import { tmdb } from "@/lib/tmdb";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{ id: string[] }>;
    searchParams: Promise<{ s?: string; e?: string }>;
}

export default async function WatchPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { s, e } = await searchParams;

    const type = id[0] as "movie" | "tv";
    const mediaId = id[1];

    let title = "Watching";
    let poster = "";

    // Fetch Metadata for UI
    try {
        const details = await tmdb.getDetails(type, mediaId);
        title = details.title || details.name;
        if (type === "tv" && s && e) {
            title += ` - S${s} E${e}`;
        }
        poster = details.backdrop_path
            ? (details.backdrop_path.startsWith("http") ? details.backdrop_path : `https://image.tmdb.org/t/p/original${details.backdrop_path}`)
            : "";
    } catch (err) {
        console.error("Failed to fetch details for watch page", err);
    }

    // Fetch Stream
    const stream = await scraper.getStream(type, mediaId, s, e);

    if (!stream) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                No stream found.
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-black">
            <div className="flex-1 relative">
                <Link href={`/${type}/${mediaId}`} className="absolute top-4 left-4 z-50">
                    <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>

                <AnimePlayer
                    sources={stream.isEmbed ? null : [{
                        url: stream.url,
                        quality: "default",
                        isM3U8: stream.url.includes(".m3u8")
                    }]}
                    malId={mediaId}
                    episodeNumber={e || "1"}
                    title={title}
                    image={poster}
                    type={type}
                    autoPlay
                    className="w-full h-full"
                />
            </div>
        </div>
    );
}
