"use client";

import { useEffect, useRef, useState } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ArrowRight, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MediaItem } from "@/types";

interface VidsrcPlayerProps {
    malId: string;
    anilistId: string;
    episodeNumber: number;
    title: string;
    image: string;
    anime?: MediaItem;
    className?: string;
}

// Multiple VidSrc domains for fallback
const VIDSRC_DOMAINS = [
    "vidsrc.cc",
    "vidsrc.in",
    "vidsrc.pm",
    "vidsrc.net"
];

export function VidsrcPlayer({
    malId,
    anilistId,
    episodeNumber,
    title,
    image,
    anime,
    className
}: VidsrcPlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { markEpisodeComplete, saveEpisodeProgress, getEpisodeProgress, updateStatus } = useLibrary();
    const { settings, user, token } = useAuth();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [currentDomain, setCurrentDomain] = useState(0);
    const [showAutoNext, setShowAutoNext] = useState(false);
    const [countdown, setCountdown] = useState(settings.autoNextTimeout);
    const [hasMarkedComplete, setHasMarkedComplete] = useState(false);

    const nextEpisodeNumber = episodeNumber + 1;
    const hasNextEpisode = anime?.episodes ? nextEpisodeNumber <= anime.episodes : true;

    // Build the VidSrc URL
    // VidSrc supports: /embed/anime/{mal_id}/{episode}
    const getVidsrcUrl = (domainIndex: number) => {
        const domain = VIDSRC_DOMAINS[domainIndex];
        // VidSrc uses MAL ID for anime
        return `https://${domain}/embed/anime/${malId}/${episodeNumber}`;
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
        console.log(`[VidSrc] Loaded from ${VIDSRC_DOMAINS[currentDomain]}`);
    };

    const handleIframeError = () => {
        // Try next domain
        if (currentDomain < VIDSRC_DOMAINS.length - 1) {
            console.log(`[VidSrc] Domain ${VIDSRC_DOMAINS[currentDomain]} failed, trying next...`);
            setCurrentDomain(prev => prev + 1);
        } else {
            console.error("[VidSrc] All domains failed");
            setIsLoading(false);
        }
    };

    // Mark episode as watched when user stays on page for significant time
    // Since we can't directly access iframe video state, we use time-based heuristic
    useEffect(() => {
        if (hasMarkedComplete) return;

        // Mark as watched after 10 minutes (600 seconds) of viewing
        // This assumes user is actually watching
        const timeout = setTimeout(() => {
            if (anime && !hasMarkedComplete) {
                setHasMarkedComplete(true);
                markEpisodeComplete({
                    ...anime,
                    watchedEpisode: episodeNumber,
                    duration: 1440, // Assume 24 min episode
                    timestamp: Date.now()
                });

                // Sync to AniList if enabled
                if (settings.autoSyncAniList && token) {
                    const totalEpisodes = anime.episodes || 0;
                    const status = totalEpisodes > 0 && episodeNumber >= totalEpisodes ? "COMPLETED" : "CURRENT";
                    updateStatus(anime.id, status, episodeNumber);
                }
            }
        }, 600000); // 10 minutes

        return () => clearTimeout(timeout);
    }, [anime, episodeNumber, hasMarkedComplete, markEpisodeComplete, settings.autoSyncAniList, token, updateStatus]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showAutoNext) {
                setShowAutoNext(false);
                setCountdown(settings.autoNextTimeout);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showAutoNext, settings.autoNextTimeout]);

    // Auto-next countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showAutoNext && countdown > 0) {
            interval = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (showAutoNext && countdown === 0) {
            router.push(`/watch/${anilistId}/${nextEpisodeNumber}`);
        }
        return () => clearInterval(interval);
    }, [showAutoNext, countdown, router, anilistId, nextEpisodeNumber]);

    const playNext = () => {
        router.push(`/watch/${anilistId}/${nextEpisodeNumber}`);
    };

    const cancelAutoNext = () => {
        setShowAutoNext(false);
        setCountdown(settings.autoNextTimeout);
    };

    return (
        <div className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl", className)}>
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                    <p className="text-zinc-400 text-sm">
                        Connecting to {VIDSRC_DOMAINS[currentDomain]}...
                    </p>
                </div>
            )}

            {/* VidSrc Iframe */}
            <iframe
                ref={iframeRef}
                src={getVidsrcUrl(currentDomain)}
                className="w-full h-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title={`${title} - Episode ${episodeNumber}`}
            />

            {/* Action Buttons Overlay */}
            <div className="absolute top-4 right-4 z-30 flex gap-2">
                {/* Mark as Watched Button */}
                {!hasMarkedComplete && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (anime) {
                                setHasMarkedComplete(true);
                                markEpisodeComplete({
                                    ...anime,
                                    watchedEpisode: episodeNumber,
                                    duration: 1440,
                                    timestamp: Date.now()
                                });
                                if (settings.autoSyncAniList && token) {
                                    const totalEpisodes = anime.episodes || 0;
                                    const status = totalEpisodes > 0 && episodeNumber >= totalEpisodes ? "COMPLETED" : "CURRENT";
                                    updateStatus(anime.id, status, episodeNumber);
                                }
                            }
                        }}
                        className="bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm"
                    >
                        ✓ Mark Watched
                    </Button>
                )}

                {/* Next Episode Button */}
                {hasNextEpisode && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={playNext}
                        className="bg-purple-600/80 hover:bg-purple-600 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium"
                    >
                        Next EP →
                    </Button>
                )}
            </div>

            {/* Auto-Next Overlay */}
            {showAutoNext && (
                <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
                    <p className="text-gray-400 text-lg font-medium mb-2">Up Next</p>
                    <h2 className="text-3xl font-bold text-white mb-6">Episode {nextEpisodeNumber}</h2>

                    <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#333"
                                strokeWidth="2"
                            />
                            <path
                                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#9333ea"
                                strokeWidth="2"
                                strokeDasharray={`${(countdown / settings.autoNextTimeout) * 100}, 100`}
                            />
                        </svg>
                        <span className="absolute text-2xl font-bold text-white">{countdown}</span>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            variant="ghost"
                            size="lg"
                            className="gap-2 rounded-full px-8"
                            onClick={cancelAutoNext}
                        >
                            <X className="w-5 h-5" /> Cancel
                        </Button>
                        <Button
                            size="lg"
                            className="gap-2 rounded-full px-8 bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={playNext}
                        >
                            <ArrowRight className="w-5 h-5" /> Play Now
                        </Button>
                    </div>
                </div>
            )}

            {/* AniList Sync Indicator */}
            {user && token && settings.autoSyncAniList && hasMarkedComplete && (
                <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Synced to AniList
                </div>
            )}
        </div>
    );
}
