"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Play, Star, Calendar, Check, Loader2, Info, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { AnimeImage } from "@/components/ui/AnimeImage";
import { MediaRow } from "@/components/common/MediaRow";
import { WatchlistButton } from "@/components/common/WatchlistButton";
import { AnilistMedia, anilist } from "@/lib/anilist";
import { useLibrary } from "@/context/LibraryContext";
import { EpisodeList } from "@/components/media/EpisodeList";
import { cn } from "@/lib/utils";
import { MediaItem } from "@/types";

interface AnimeDetailsProps {
    anime: AnilistMedia;
}

export function AnimeDetails({ anime }: AnimeDetailsProps) {
    const { history } = useLibrary();
    // Removed useDownloads hook if unused in this component (used in EpisodeList now)

    // Derived Data
    const title = anime.title.english || anime.title.romaji;
    const banner = anime.bannerImage || anime.coverImage.extraLarge;
    const poster = anime.coverImage.extraLarge || anime.coverImage.large;
    const year = anime.seasonYear || anime.season ? `${anime.season} ${anime.seasonYear}` : "";

    // Note: totalEpisodes logic moved to EpisodeList? No, we pass it down.
    const totalEpisodes = anime.episodes || (anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : 12);

    const [expandedDesc, setExpandedDesc] = useState(false);

    // Smart CTA Logic derived from history
    const historyItem = history.find((h: MediaItem) => String(h.id) === String(anime.id));
    const nextEpisode = historyItem?.watchedEpisode ? historyItem.watchedEpisode : 1;
    const ctaLabel = historyItem ? `Continue Episode ${nextEpisode}` : "Start Watching";

    // Prepare relations
    const relations = anime.relations?.edges || [];

    return (
        <div className="min-h-screen pb-20 bg-background text-foreground animate-in fade-in duration-700">
            {/* Hero / Backdrop */}
            <div className="relative h-[70vh] w-full overflow-hidden">
                {banner && (
                    <div className="absolute inset-0">
                        <AnimeImage
                            src={banner}
                            variants={[anime.coverImage.extraLarge, anime.coverImage.large]}
                            malId={anime.idMal}
                            alt={title}
                            fill
                            className="object-cover opacity-60 hover:scale-105 transition-transform duration-[20s]"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,transparent,rgba(0,0,0,0.6))]" />
                    </div>
                )}

                <div className="container relative z-10 flex h-full flex-col justify-end pb-12">
                    <div className="flex flex-col gap-8 md:flex-row md:items-end">
                        {/* Poster */}
                        <div className="hidden md:block relative h-[450px] w-[300px] overflow-hidden rounded-xl shadow-2xl shrink-0 border-2 border-white/10 group">
                            <AnimeImage
                                src={poster}
                                variants={[anime.coverImage.large, anime.coverImage.medium, banner]}
                                malId={anime.idMal}
                                alt={title}
                                fill
                                className="object-cover"
                                priority
                            />
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

                {/* Episode List Component */}
                <EpisodeList
                    animeId={anime.id}
                    malId={anime.idMal}
                    totalEpisodes={totalEpisodes}
                    bannerImage={banner}
                    relations={relations}
                    title={title}
                />

                {/* Recommendations */}
                <div className="mt-10">
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
        let mounted = true;
        const loadRecs = async () => {
            // 1. Try AniList Recommendations
            let nodes: any[] = [];

            if (anime.recommendations?.nodes && anime.recommendations.nodes.length > 0) {
                nodes = anime.recommendations.nodes
                    .map(n => n.mediaRecommendation)
                    .filter(m => {
                        // Strict Filters:
                        // 1. Must exist
                        // 2. Must be ANIME (no Manga/Novels) based on type or format
                        // 3. Must NOT be the current anime
                        // 4. Ideally exclude music/specials if desired (optional)
                        if (!m) return false;
                        if (m.id === anime.id) return false;
                        if (m.type && m.type !== "ANIME") return false;
                        if (m.format && (m.format === "MANGA" || m.format === "NOVEL" || m.format === "ONE_SHOT")) return false;
                        return true;
                    })
                    .slice(0, 15);
            }

            // 2. Fallback: If minimal recommendations (e.g. < 5), supplement with Genre Search
            if (nodes.length < 5 && anime.genres && anime.genres.length > 0) {
                try {
                    // Fetch more to filter
                    const data = await anilist.getAnimeByGenre(anime.genres, 1, 12);
                    if (data?.Page?.media) {
                        const existingIds = new Set(nodes.map(n => n.id));
                        existingIds.add(anime.id); // Ensure current anime is excluded from fallback too

                        const fallback = data.Page.media.filter((m: any) => !existingIds.has(m.id));

                        // Fill up to 15
                        const needed = 15 - nodes.length;
                        nodes = [...nodes, ...fallback.slice(0, needed)];
                    }
                } catch (e) {
                    console.error("Failed to load genre fallback", e);
                }
            }

            if (mounted) {
                setRecs(nodes);
                setLoading(false);
            }
        };
        loadRecs();
        return () => { mounted = false; };
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
