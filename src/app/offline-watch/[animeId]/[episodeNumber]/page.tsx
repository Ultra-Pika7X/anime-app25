"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDownloads } from "@/context/DownloadContext";
import { AnimePlayer } from "@/components/player/AnimePlayer";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function OfflineWatchPage() {
    const params = useParams();
    const router = useRouter();
    const { getDownloadUrl, downloads } = useDownloads(); // We need downloads list to get metadata
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // params.id is ['id', 'ep']? No, it depends on folder structure.
    // If path is src/app/offline-watch/[animeId]/[episodeNumber]/page.tsx
    // params = { animeId: string, episodeNumber: string }
    const { animeId, episodeNumber } = params as { animeId: string; episodeNumber: string };
    const downloadId = `${animeId}-${episodeNumber}`;

    // Find metadata from context
    const metadata = downloads.find(d => d.id === downloadId);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const url = await getDownloadUrl(downloadId);
                if (active) {
                    if (url) {
                        setBlobUrl(url);
                    } else {
                        setError("File not found or expired.");
                    }
                    setLoading(false);
                }
            } catch (e) {
                if (active) {
                    setError("Failed to load offline file.");
                    setLoading(false);
                }
            }
        };
        load();
        return () => { active = false; };
    }, [downloadId, getDownloadUrl]);

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin" /></div>;
    }

    if (error || !blobUrl || !metadata) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white gap-4">
                <p className="text-red-500">{error || "Episode not found in offline library."}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-black">
            <div className="flex-1 relative">
                <div className="absolute top-4 left-4 z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white bg-black/50 hover:bg-black/80 rounded-full"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </div>

                <AnimePlayer
                    sources={[{ url: blobUrl, quality: 'Offline', isM3U8: false }]}
                    malId={animeId}
                    episodeNumber={episodeNumber}
                    title={metadata.title}
                    image={metadata.image}
                    type="tv"
                    autoPlay
                    className="w-full h-full"
                    offlineMode={true}
                    // We can reconstruct minimal anime object for progress tracking if we want
                    anime={{
                        id: Number(animeId),
                        title: { romaji: metadata.title, english: metadata.title, native: metadata.title },
                        coverImage: { extraLarge: metadata.image, large: metadata.image, medium: metadata.image, color: "#9333ea" },
                        bannerImage: metadata.image,
                        status: "RELEASING",
                        episodes: 12,
                        genres: [],
                        format: "TV",
                        type: "ANIME",
                        seasonYear: 2024,
                        nextAiringEpisode: undefined,
                        description: "Offline Episode"
                    }}
                />
            </div>
        </div>
    );
}
