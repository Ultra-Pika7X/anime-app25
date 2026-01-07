"use client";

import { Button } from "@/components/ui/Button";
import { Play, Star, Calendar, Check, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MediaRow } from "@/components/common/MediaRow";
import { WatchlistButton } from "@/components/common/WatchlistButton";
import { AnilistMedia, anilist } from "@/lib/anilist";
import { useLibrary } from "@/context/LibraryContext";
import { useDownloads } from "@/context/DownloadContext";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { scraper, Episode } from "@/lib/scraper";
import { MediaItem } from "@/types";

interface AnimeDetailsProps {
    anime: AnilistMedia;
}

export function AnimeDetails({ anime }: AnimeDetailsProps) {
    const { getEpisodeProgress, history, saveEpisodeProgress, updateStatus } = useLibrary();
    const { downloads } = useDownloads();

    // Derived Data
    const title = anime.title.english || anime.title.romaji;
    const banner = anime.bannerImage || anime.coverImage.extraLarge;
    const poster = anime.coverImage.extraLarge || anime.coverImage.large;
    const year = anime.seasonYear || anime.season ? `${anime.season} ${anime.seasonYear}` : "";

    // Episode State
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loadingEpisodes, setLoadingEpisodes] = useState(true);
    const totalEpisodes = anime.episodes || (anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : 12);
    const [useFallback, setUseFallback] = useState(false);
    const [expandedDesc, setExpandedDesc] = useState(false);

    // Episode Grouping (e.g., 0-99, 100-199)
    const [selectedGroup, setSelectedGroup] = useState<string>("1-100");

    useEffect(() => {
        let mounted = true;
        const fetchEpisodes = async () => {
            try {
                // Load preference
                const prefKey = `anime_source_pref_${anime.id}`;
                const savedProvider = localStorage.getItem(prefKey) || undefined;

                const data = await scraper.getEpisodes(String(anime.id), savedProvider);

                if (mounted) {
                    if (data && data.length > 0) {
                        setEpisodes(data);

                        // Detect and Save used provider
                        const firstId = data[0].id; // "pahe:..." or "gogo:..."
                        let used = "";
                        if (firstId.startsWith("pahe:")) used = "AnimePahe";
                        else if (firstId.startsWith("gogo:")) used = "Gogoanime";

                        if (used && used !== savedProvider) {
                            localStorage.setItem(prefKey, used);
                        }
                    } else {
                        setUseFallback(true);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch accurate episodes", e);
                if (mounted) setUseFallback(true);
            } finally {
                if (mounted) setLoadingEpisodes(false);
            }
        };
        fetchEpisodes();
        return () => { mounted = false; };
    }, [anime.id]);

    const displayEpisodes = useMemo(() => {
        const source = useFallback
            ? Array.from({ length: totalEpisodes }, (_, i) => ({
                id: String(i + 1),
                number: i + 1,
                title: `Episode ${i + 1}`,
                image: undefined,
                isFiller: false
            } as Episode))
            : episodes;

        // Filter by Group
        if (source.length <= 50) return source; // Show all if small

        // Parse Group "1-100"
        const [start, end] = selectedGroup.split("-").map(Number);
        return source.filter(e => e.number >= start && e.number <= end);
    }, [useFallback, totalEpisodes, episodes, selectedGroup]);

    // Generate Groups
    const episodeGroups = useMemo(() => {
        const count = useFallback ? totalEpisodes : episodes.length;
        if (count <= 50) return [];

        const groups = [];
        for (let i = 1; i <= count; i += 100) {
            const end = Math.min(i + 99, count);
            groups.push(`${i}-${end}`);
        }
        return groups;
    }, [totalEpisodes, episodes.length, useFallback]);

    // Smart CTA Logic
    const [lastWatched, setLastWatched] = useState<number | null>(null);
    const [checkingHistory, setCheckingHistory] = useState(true);

    useEffect(() => {
        // Find the highest episode number with progress
        // Ideally we would query `history` for this anime, but getting progress for ALL episodes to check is expensive?
        // Actually, we can check the history logic.
        // For now, let's just default to Ep 1, or check the `getEpisodeProgress` for known ones if we have a list.
        // Better: LibraryContext's `history` usually contains the *last watched state* for the show itself?
        // NO, `history` is a list of MediaItems that serve as "Continue Watching". 
        // Let's use `useLibrary().history`!

        // This logic will run once on mount (or when history changes)
        // We cannot call hook inside effect, but we can access `useLibrary().history` via prop/context if exposed.
        // I'll grab it from context above.
    }, []);

    // Access raw history from context
    const historyItem = history.find((h: MediaItem) => String(h.id) === String(anime.id));

    // Determine CTA
    // If historyItem exists, it likely stores `watchedEpisode`.
    // Let's check `MediaItem` type definition in types.ts (implied). Usually `watchedEpisode`.
    // If not in history, check progressMap?
    // Let's rely on historyItem for "Main CTA".

    const nextEpisode = historyItem?.watchedEpisode ? historyItem.watchedEpisode : 1;
    // If completed (watchedEpisode == total), suggest rewatch 1? Or just keep at max.
    // If user finished ep 5, watchedEpisode might be 5. So next is 5? Or 6?
    // Usually "Continue Watching" means resume current if partially watched, or next if finished.
    // MediaItem usually stores "progress" in seconds for that episode.
    // Let's assume `watchedEpisode` points to the active one.

    const ctaLabel = historyItem ? `Continue Episode ${nextEpisode}` : "Start Watching";

    // Filter downloads
    const animeDownloads = downloads.filter(d => d.animeId === String(anime.id));

    return (
        <div className="min-h-screen pb-20 bg-background text-foreground animate-in fade-in duration-700">
            {/* Hero / Backdrop */}
            <div className="relative h-[70vh] w-full overflow-hidden">
                {banner && (
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105"
                        style={{ backgroundImage: `url(${banner})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,transparent,rgba(0,0,0,0.6))]" />
                    </div>
                )}

                <div className="container relative z-10 flex h-full flex-col justify-end pb-12">
                    <div className="flex flex-col gap-8 md:flex-row md:items-end">
                        {/* Poster */}
                        <div className="hidden md:block relative h-[450px] w-[300px] overflow-hidden rounded-xl shadow-2xl shrink-0 border-2 border-white/10 group">
                            {poster ? (
                                <Image
                                    src={poster}
                                    alt={title}
                                    fill
                                    className="object-cover"
                                />
                            ) : <div className="h-full w-full bg-muted" />}
                        </div>

                        <div className="flex flex-col gap-6 max-w-4xl pb-4">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black tracking-tighter md:text-6xl text-white drop-shadow-2xl leading-[1.1]">
                                    {title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/90">
                                    <div className="flex items-center gap-1 bg-yellow-500 text-black px-2 py-0.5 rounded-md font-bold shadow-lg shadow-yellow-500/20">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span>{anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A"}</span>
                                    </div>
                                    <span className="text-white/40">•</span>
                                    <div className="flex items-center gap-2 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
                                        <Calendar className="h-4 w-4" />
                                        <span>{year}</span>
                                    </div>
                                    <span className="text-white/40">•</span>
                                    <div className="bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
                                        {anime.format} • {anime.episodes || "?"} Episodes
                                    </div>
                                    <span className="text-white/40">•</span>
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-bold border",
                                        anime.status === "RELEASING"
                                            ? "bg-primary/20 text-primary border-primary/50"
                                            : "bg-green-500/20 text-green-400 border-green-500/50"
                                    )}>
                                        {anime.status}
                                    </div>
                                </div>

                                {/* Genres */}
                                <div className="flex flex-wrap gap-2">
                                    {anime.genres?.slice(0, 5).map(g => (
                                        <span key={g} className="text-xs bg-white/5 hover:bg-white/10 text-white/80 px-2.5 py-1 rounded-full transition-colors border border-white/5">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="relative max-w-3xl">
                                <p
                                    className={cn(
                                        "text-lg text-white/80 font-medium leading-relaxed transition-all duration-300",
                                        expandedDesc ? "" : "line-clamp-3"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: anime.description || "" }}
                                />
                                {anime.description && anime.description.length > 200 && (
                                    <button
                                        onClick={() => setExpandedDesc(!expandedDesc)}
                                        className="mt-1 flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-widest"
                                    >
                                        {expandedDesc ? (
                                            <>Show Less <ChevronUp className="w-3 h-3" /></>
                                        ) : (
                                            <>Read More <ChevronDown className="w-3 h-3" /></>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-4 mt-4">
                                <Link href={`/watch/${anime.id}/${nextEpisode}`}>
                                    <Button size="lg" className="h-14 px-8 gap-3 text-lg font-bold rounded-full shadow-[0_0_30px_rgba(97,82,223,0.35)] hover:shadow-[0_0_45px_rgba(97,82,223,0.5)] hover:scale-105 transition-all duration-300 bg-primary hover:bg-primary/90">
                                        <Play className="h-6 w-6 fill-current" /> {ctaLabel}
                                    </Button>
                                </Link>
                                <WatchlistButton
                                    item={{
                                        id: anime.id,
                                        title: anime.title,
                                        coverImage: anime.coverImage,
                                        episodes: anime.episodes,
                                        format: anime.format,
                                        status: anime.status,
                                        averageScore: anime.averageScore,
                                        // add dummy duration for mapping
                                        duration: 24,
                                        type: "ANIME"
                                    }}
                                    className="h-14 px-8 text-lg rounded-full bg-white/10 hover:bg-white/20 border-white/10 backdrop-blur-md"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mt-12 space-y-8">

                {/* Episodes Header / Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold">Episodes</h2>
                        {loadingEpisodes ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                            <span className="px-3 py-1 rounded-full bg-white/5 text-sm font-mono text-muted-foreground border border-white/5">
                                {totalEpisodes} Total
                            </span>
                        )}
                    </div>

                    {/* Group Selector */}
                    {episodeGroups.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {episodeGroups.map(group => (
                                <button
                                    key={group}
                                    onClick={() => setSelectedGroup(group)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                                        selectedGroup === group
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                    )}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayEpisodes.length > 0 ? (
                        displayEpisodes.map((ep) => {
                            const progData = getEpisodeProgress(anime.id, ep.number);
                            // Safety check
                            const progress = (progData && typeof progData === 'object' && 'progress' in progData) ? progData.progress : 0;
                            const duration = (progData && typeof progData === 'object' && 'duration' in progData) ? progData.duration : 1;

                            const percent = (progress / duration) * 100;
                            const isCompleted = percent > 90;

                            const downloadItem = animeDownloads.find(d => d.episodeNumber === ep.number);
                            const isDownloaded = downloadItem?.status === 'completed';
                            const isDownloading = downloadItem?.status === 'downloading';

                            const epImage = ep.image || banner;

                            // Click Handler: Opens player immediately, resets progress, saves to Continue Watching
                            const handleEpisodeClick = async (e: React.MouseEvent) => {
                                e.preventDefault();

                                // 1. Mark as Currently Watching on AniList
                                updateStatus(anime.id, "CURRENT");

                                // 2. Save to Continue Watching (sets this episode as active)
                                //    We DON'T reset progress here - let the player resume if there's saved progress
                                //    The player will handle resuming from where user left off

                                // 3. Navigate to player (source auto-trying screen will show)
                                window.location.href = `/watch/${anime.id}/${ep.number}`;
                            };

                            return (
                                <div
                                    key={ep.number}
                                    onClick={handleEpisodeClick}
                                    className="group flex flex-col gap-2 p-3 rounded-2xl bg-secondary/10 hover:bg-secondary/20 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                >
                                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/50 shadow-inner">
                                        {epImage ? (
                                            <Image
                                                src={epImage}
                                                alt={`Ep ${ep.number}`}
                                                fill
                                                className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-mono">NO IMAGE</div>
                                        )}

                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-black/20 backdrop-blur-[2px]">
                                            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                                                <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {progress > 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 detail-progress">
                                                <div className="h-full bg-primary shadow-[0_0_10px_rgba(97,82,223,0.8)]" style={{ width: `${Math.min(percent, 100)}%` }} />
                                            </div>
                                        )}

                                        {/* Corner Badges */}
                                        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                                            {isCompleted && (
                                                <div className="bg-green-500 text-white p-1 rounded-md shadow-lg shadow-black/50" title="Watched">
                                                    <Check className="w-3 h-3 stroke-[3]" />
                                                </div>
                                            )}
                                            {isDownloaded && (
                                                <div className="bg-blue-500 text-white p-1 rounded-md shadow-lg shadow-black/50" title="Downloaded">
                                                    <Check className="w-3 h-3 stroke-[3]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Filler Badge */}
                                        {ep.isFiller && (
                                            <div className="absolute top-2 left-2 bg-orange-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                                                Filler
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-0.5 px-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors text-white/90">
                                                {ep.title || `Episode ${ep.number}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                                            <span>Episode {ep.number}</span>
                                            {isDownloading && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full h-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-white/5 rounded-2xl">
                            <Info className="w-8 h-8 mb-2 opacity-50" />
                            <p>No episodes found in this range.</p>
                        </div>
                    )}
                </div>

                {/* Recommendations */}
                <div className="container mt-10">
                    <RecommendationsSection anime={anime} />
                </div>
            </div>
        </div>
    );
}

function RecommendationsSection({ anime }: { anime: AnilistMedia }) {
    const [recs, setRecs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRecs = async () => {
            // 1. Try AniList Recommendations provided in the object
            if (anime.recommendations?.nodes && anime.recommendations.nodes.length > 0) {
                const mapped = anime.recommendations.nodes
                    .map(n => ({
                        id: n.mediaRecommendation?.id,
                        title: n.mediaRecommendation?.title,
                        coverImage: n.mediaRecommendation?.coverImage,
                        type: "ANIME",
                        averageScore: n.mediaRecommendation?.averageScore,
                        format: n.mediaRecommendation?.format
                    }))
                    .filter(i => i.id)
                    .slice(0, 15);
                setRecs(mapped);
                setLoading(false);
                return;
            }

            // 2. Fallback: Search by Genre
            if (anime.genres && anime.genres.length > 0) {
                try {
                    const data = await anilist.getAnimeByGenre(anime.genres, 1, 12);
                    if (data?.Page?.media) {
                        // Filter out current anime
                        const filtered = data.Page.media.filter((m: any) => m.id !== anime.id);
                        setRecs(filtered);
                    }
                } catch (e) {
                    console.error("Failed to load genre fallback", e);
                }
            }
            setLoading(false);
        };
        loadRecs();
    }, [anime]);

    if (!loading && recs.length === 0) return null;

    return (
        <MediaRow
            title={anime.recommendations?.nodes?.length ? "More Like This" : "Recommended For You"}
            items={recs}
            type="tv" // default route
        />
    );
}
