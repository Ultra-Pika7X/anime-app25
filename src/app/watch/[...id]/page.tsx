import { scraper } from "@/lib/scraper";
import { AnimePlayer } from "@/components/player/AnimePlayer";
import { anilist } from "@/lib/anilist";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimeDetails } from "@/components/media/AnimeDetails";

interface PageProps {
    params: Promise<{ id: string[] }>;
}

export default async function WatchPage({ params }: PageProps) {
    const { id } = await params;

    const anilistId = id[0];
    const episodeNumber = id[1] ? Number(id[1]) : null;

    let anime: any = null;

    try {
        const data = await anilist.getInfo(Number(anilistId));
        anime = data.data.Media;
    } catch (e) {
        console.error("Failed to fetch anime details", e);
        notFound();
    }

    if (!anime) return notFound();

    // VIEW MODE: ID only -> Show Details Page
    if (!episodeNumber) {
        return <AnimeDetails anime={anime} />;
    }

    // WATCH MODE: ID + Episode -> Show Player
    let streams: any[] = [];
    try {
        streams = await scraper.getStreams(anilistId, episodeNumber);
    } catch (e) {
        console.error("Failed to get streams", e);
    }

    const title = anime.title.english || anime.title.romaji;
    const cover = anime.bannerImage || anime.coverImage.extraLarge;

    // TODO: Handle Continue Watching update here or via client side effect (prefer client side for Auth context access)

    if (streams.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4 text-white bg-black">
                <p>No stream found for Episode {episodeNumber}.</p>
                <Link href={`/watch/${anilistId}`}>
                    <Button variant="outline">Back to Details</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-black">
            <div className="flex-1 relative">
                <Link href={`/watch/${anilistId}`} className="absolute top-4 left-4 z-50">
                    <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>

                <AnimePlayer
                    sources={streams}
                    malId={anilistId} // Using AniList ID as unique ID
                    episodeNumber={String(episodeNumber)}
                    title={`${title} - EP ${episodeNumber}`}
                    image={cover}
                    type="tv" // Anime is usually treated as TV in player logic or just 'anime'
                    autoPlay
                    className="w-full h-full"
                    anime={anime}
                />
            </div>
        </div>
    );
}
