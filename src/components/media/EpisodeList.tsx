"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Play, Check, Loader2, Info, ArrowRight } from "lucide-react";
import { AnimeImage } from "@/components/ui/AnimeImage";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/context/LibraryContext";
import { useDownloads } from "@/context/DownloadContext";
import { Episode, scraper } from "@/lib/scraper";

interface EpisodeListProps {
    animeId: number;
    malId?: number | null;
    totalEpisodes: number;
    bannerImage?: string;
    relations?: any[]; // AniList relations
}

export function EpisodeList({ animeId, malId, totalEpisodes, bannerImage, relations }: EpisodeListProps) {
    const { getEpisodeProgress, updateStatus } = useLibrary();
    const { downloads } = useDownloads(); // Assumes this context exists and works

    // --- State ---
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [useFallback, setUseFallback] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>("1-100");

    // --- Fetch Episodes ---
    useEffect(() => {
        let mounted = true;
        const fetchEpisodes = async () => {
            // Basic caching optimization to prevent refetch on every remount if data is in parent?
            // For now keep local state as in original AnimeDetails
            try {
                const prefKey = `anime_source_pref_${animeId}`;
                const savedProvider = localStorage.getItem(prefKey) || undefined;
                const data = await scraper.getEpisodes(String(animeId), savedProvider);

                if (mounted) {
                    if (data && data.length > 0) {
                        setEpisodes(data);
                    } else {
                        setUseFallback(true);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch episodes", e);
                if (mounted) setUseFallback(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchEpisodes();
        return () => { mounted = false; };
    }, [animeId]);


    // --- Grouping Logic ---
    const groups = useMemo(() => {
        const count = useFallback ? totalEpisodes : episodes.length;
        if (count <= 50) return [];
        const g = [];
        for (let i = 1; i <= count; i += 100) {
            const end = Math.min(i + 99, count);
            g.push(`${i}-${end}`);
        }
        return g;
    }, [totalEpisodes, episodes.length, useFallback]);

    const displayEpisodes = useMemo(() => {
        const source = useFallback
            ? Array.from({ length: totalEpisodes }, (_, i) => ({
                id: String(i + 1),
                number: i + 1,
                title: `Episode ${i + 1}`,
                isFiller: false
            } as Episode))
            : episodes;

        if (source.length <= 50) return source;

        const [start, end] = selectedGroup.split("-").map(Number);
        return source.filter(e => e.number >= start && e.number <= end);
    }, [useFallback, totalEpisodes, episodes, selectedGroup]);


    // --- Seasons (Relations) ---
    const relatedSeasons = useMemo(() => {
        if (!relations) return [];
        return relations.filter((r: any) =>
            (r.relationType === "SEQUEL" || r.relationType === "PREQUEL" || r.relationType === "ALTERNATIVE") &&
            r.node.type === "ANIME" &&
            r.node.format !== "MOVIE" // Keep it to TV seasons mostly? Or include movies? Let's include all for now.
        ).sort((a, b) => a.node.id - b.node.id); // Loose sort by ID
    }, [relations]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* --- Seasons Navigation --- */}
            {relatedSeasons.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white/80 px-1">Related Seasons</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                        {relatedSeasons.map((rel: any) => (
                            <Link
                                key={rel.node.id}
                                href={`/anime/${rel.node.id}`}
                                className="snap-start flex-shrink-0 w-[140px] group flex flex-col gap-2"
                            >
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-white/5 group-hover:border-primary/50 transition-colors">
                                    {rel.node.coverImage?.medium && (
                                        <AnimeImage
                                            src={rel.node.coverImage.medium}
                                            malId={rel.node.idMal}
                                            // Fallback to other sizes if available (though only medium fetched here usually)
                                            alt={rel.node.title.romaji}
                                            fill
                                            className="object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                                        <span className="text-[10px] uppercase font-bold bg-black/60 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                                            {rel.relationType}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-zinc-400 group-hover:text-white line-clamp-2 leading-tight">
                                    {rel.node.title.english || rel.node.title.romaji}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Episodes Header --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">Episodes</h2>
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                        <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-zinc-400 border border-white/5">
                            {totalEpisodes} Eps
                        </span>
                    )}
                </div>

                {/* Group Selector */}
                {groups.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {groups.map(g => (
                            <button
                                key={g}
                                onClick={() => setSelectedGroup(g)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium transition-all border border-transparent",
                                    selectedGroup === g
                                        ? "bg-primary/20 text-primary border-primary/20"
                                        : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                                )}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* --- Episode Grid --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {displayEpisodes.map((ep) => {
                    const progData = getEpisodeProgress(animeId, ep.number);
                    const progress = progData?.progress || 0;
                    const duration = progData?.duration || 1;
                    const percent = (progress / duration) * 100;
                    const isCompleted = percent > 90;

                    const downloadItem = downloads.find((d: any) => d.animeId === String(animeId) && d.episodeNumber === ep.number);
                    const isDownloaded = downloadItem?.status === 'completed';
                    const isDownloading = downloadItem?.status === 'downloading';

                    return (
                        <div
                            key={ep.number}
                            onClick={() => {
                                updateStatus(animeId, "CURRENT");
                                window.location.href = `/watch/${animeId}/${ep.number}`;
                            }}
                            className={cn(
                                "group relative flex flex-col gap-2 p-2 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden",
                                isCompleted
                                    ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                                    : "bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/60"
                            )}
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/50">
                                {ep.image || bannerImage ? (
                                    <AnimeImage
                                        src={ep.image}
                                        variants={[bannerImage]}
                                        malId={malId}
                                        alt={`Ep ${ep.number}`}
                                        fill
                                        className={cn(
                                            "object-cover transition-all duration-500",
                                            isCompleted ? "opacity-40 grayscale-[50%]" : "opacity-70 group-hover:opacity-100 group-hover:scale-105"
                                        )}
                                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 33vw, 20vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs font-mono">NO IMAGE</div>
                                )}

                                {/* Hover Play Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 bg-black/40">
                                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                                        <Play className="h-4 w-4 fill-current ml-0.5" />
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {progress > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                        <div
                                            className={cn("h-full shadow-[0_0_8px_currentColor]", isCompleted ? "bg-green-500" : "bg-primary")}
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        />
                                    </div>
                                )}

                                {/* Status Badges */}
                                <div className="absolute top-1 right-1 flex flex-col gap-1">
                                    {isCompleted && (
                                        <div className="bg-green-500 text-black p-0.5 rounded shadow-sm">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                    )}
                                    {isDownloaded && !isCompleted && (
                                        <div className="bg-blue-500 text-white p-0.5 rounded shadow-sm">
                                            <ArrowRight className="w-3 h-3 rotate-90" />
                                        </div>
                                    )}
                                </div>

                                {/* Filler Label */}
                                {ep.isFiller && (
                                    <div className="absolute top-1 left-1 bg-orange-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                                        Filler
                                    </div>
                                )}
                            </div>

                            {/* Meta */}
                            <div className="flex flex-col px-1 pb-1">
                                <span className={cn(
                                    "font-semibold text-sm line-clamp-1 transition-colors",
                                    isCompleted ? "text-zinc-500" : "text-zinc-200 group-hover:text-primary"
                                )}>
                                    {ep.title || `Episode ${ep.number}`}
                                </span>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] font-mono text-zinc-500">
                                        EP {ep.number}
                                    </span>
                                    {isDownloading && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State */}
                {displayEpisodes.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/5 rounded-xl bg-white/[0.02]">
                        <Info className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-sm">No episodes found in this range.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
