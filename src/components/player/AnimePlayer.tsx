
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MediaPlayer, MediaProvider, Track, type MediaPlayerInstance } from "@vidstack/react";
// Custom CSS for player specific things if needed, or just Tailwind
// import '@vidstack/react/player/styles/default/theme.css'; // REMOVED
// import '@vidstack/react/player/styles/default/layouts/video.css'; // REMOVED
import { Button } from "@/components/ui/Button";
import { SkipForward, DownloadCloud, Loader2, Check, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/context/LibraryContext";
import { useDownloads } from "@/context/DownloadContext";
import { useAuth } from "@/context/AuthContext";
import { MediaItem } from "@/types";
import { useRouter } from "next/navigation";
import { recordSourceSuccess, recordSourceFailure, sortSourcesByRecommendation, getRecommendedSource, extractProviderFromQuality } from "@/lib/sourceMemory";
import { getSkipData, saveSkipData, SkipTime } from "@/lib/skipCache";
import { scraper, StreamSource } from "@/lib/scraper";
import { useAniSkip } from "@/hooks/useAniSkip";
import { VidsrcPlayer } from "./VidsrcPlayer";

export interface Source {
    url: string;
    quality?: string;
    isM3U8?: boolean;
    provider?: string;
    isRecommended?: boolean;
}

interface AnimePlayerProps {
    sources: Source[] | null;
    subtitles?: { url: string; lang: string; label: string }[];
    intro?: { start: number; end: number };
    outro?: { start: number; end: number };
    className?: string;
    autoPlay?: boolean;
    malId: string;
    episodeNumber: string;
    title: string;
    image: string;
    type: "movie" | "tv";
    anime?: MediaItem;
    offlineMode?: boolean;
}

export function AnimePlayer({
    sources: initialSources,
    subtitles,
    intro,
    outro,
    className,
    autoPlay = false,
    malId,
    episodeNumber,
    title,
    image,
    type,
    anime,
    offlineMode = false
}: AnimePlayerProps) {
    const playerRef = useRef<MediaPlayerInstance>(null);
    const { markEpisodeComplete, saveEpisodeProgress, getEpisodeProgress } = useLibrary();
    const { startDownload, downloads } = useDownloads();
    const { settings } = useAuth();
    const router = useRouter();

    // Auto Next Logic
    const [showAutoNext, setShowAutoNext] = useState(false);
    const [showNextButton, setShowNextButton] = useState(false);
    const [countdown, setCountdown] = useState(settings.autoNextTimeout);
    const nextEpisodeNumber = Number(episodeNumber) + 1;
    const hasNextEpisode = anime?.episodes ? nextEpisodeNumber <= anime.episodes : true;

    // Player State
    // Source State
    const [sources, setSources] = useState<Source[]>([]);
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [testingComplete, setTestingComplete] = useState(false);
    const [logs, setLogs] = useState<{ name: string; status: 'pending' | 'trying' | 'failed' | 'success' }[]>([]);
    const [savedTimestamp, setSavedTimestamp] = useState(0);
    const [showSkip, setShowSkip] = useState(false);
    const [skipType, setSkipType] = useState<"intro" | "outro">("intro");
    const [isCompleted, setIsCompleted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [allSourcesFailed, setAllSourcesFailed] = useState(false);
    const [useFallback, setUseFallback] = useState(false);

    // Custom Control State
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [isBuffering, setIsBuffering] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Persistent Volume/Mute from localStorage
    useEffect(() => {
        const savedVolume = localStorage.getItem('player_volume');
        const savedMuted = localStorage.getItem('player_muted');
        if (savedVolume !== null) setVolume(Number(savedVolume));
        if (savedMuted !== null) setIsMuted(savedMuted === 'true');
    }, []);

    useEffect(() => {
        localStorage.setItem('player_volume', String(volume));
        localStorage.setItem('player_muted', String(isMuted));
    }, [volume, isMuted]);

    // AniSkip Integration
    const { data: aniSkipData, isLoading: isAniSkipLoading } = useAniSkip(malId, episodeNumber);

    // Normalize intervals to use startTime/endTime regardless of source
    const computedIntro = aniSkipData?.op?.interval
        ? aniSkipData.op.interval
        : intro
            ? { startTime: intro.start, endTime: intro.end }
            : null;
    const computedOutro = aniSkipData?.ed?.interval
        ? aniSkipData.ed.interval
        : outro
            ? { startTime: outro.start, endTime: outro.end }
            : null;

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Download State
    const episodeId = `${malId}-${episodeNumber}`;
    const download = downloads.find(d => d.id === episodeId);
    const isDownloading = download?.status === "downloading" || download?.status === "pending";
    const isDownloaded = download?.status === "completed";

    const cancelAutoNext = () => {
        setShowAutoNext(false);
        setCountdown(settings.autoNextTimeout);
    };

    const playNext = () => {
        router.push(`/watch/${malId}/${nextEpisodeNumber}`);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showAutoNext && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (showAutoNext && countdown === 0) {
            playNext();
        }
        return () => clearInterval(interval);
    }, [showAutoNext, countdown]);

    // SECURITY: Block player hijacking and DOM injection attempts
    useEffect(() => {
        // Block document.write (commonly used by ad scripts)
        const originalWrite = document.write;
        document.write = () => {
            console.warn("🛡️ Blocked document.write attempt");
        };

        // Block document.writeln as well
        const originalWriteln = document.writeln;
        document.writeln = () => {
            console.warn("🛡️ Blocked document.writeln attempt");
        };

        // Block fullscreen requests from non-custom players ONLY
        const originalRequestFullscreen = Element.prototype.requestFullscreen;
        Element.prototype.requestFullscreen = function (this: Element, ...args) {
            // Only allow fullscreen from our player container or its children
            const isCustomPlayer = this.closest('[data-custom-player]');
            const isVideo = this.tagName === 'VIDEO' && this.closest('[data-custom-player]');

            if (isCustomPlayer || isVideo) {
                return originalRequestFullscreen.apply(this, args);
            }
            console.warn("🛡️ Blocked fullscreen hijack attempt from:", this);
            return Promise.reject(new Error("Fullscreen blocked - only custom player allowed"));
        };

        // Block createElement for script/iframe injection attempts
        const originalCreateElement = document.createElement.bind(document);
        document.createElement = function (tagName: string, options?: ElementCreationOptions) {
            const tag = tagName.toLowerCase();
            // Block iframe creation entirely
            if (tag === 'iframe') {
                console.warn("🛡️ Blocked iframe creation attempt");
                // Return a dummy div instead
                return originalCreateElement('div', options);
            }
            // Block external script injection
            if (tag === 'script') {
                console.warn("🛡️ Blocked script injection attempt");
                return originalCreateElement('div', options);
            }
            return originalCreateElement(tagName, options);
        };

        // Intercept keyboard shortcuts for custom player control
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!playerRef.current) return;

            // Only handle if not in an input field
            if (document.activeElement?.tagName === 'INPUT') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    if (playerRef.current.paused) {
                        playerRef.current.play();
                    } else {
                        playerRef.current.pause();
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    playerRef.current.enterFullscreen();
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    playerRef.current.currentTime = Math.max(0, playerRef.current.currentTime - 10);
                    break;
                case 'arrowright':
                    e.preventDefault();
                    playerRef.current.currentTime += 10;
                    break;
                case 'arrowup':
                    e.preventDefault();
                    playerRef.current.volume = Math.min(1, playerRef.current.volume + 0.1);
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    playerRef.current.volume = Math.max(0, playerRef.current.volume - 0.1);
                    break;
                case 'm':
                    e.preventDefault();
                    playerRef.current.muted = !playerRef.current.muted;
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.write = originalWrite;
            document.writeln = originalWriteln;
            Element.prototype.requestFullscreen = originalRequestFullscreen;
            document.createElement = originalCreateElement;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Fetch Sources & Initialize Queue
    const [savedProgress, setSavedProgress] = useState<number>(0);
    const savedProvider = getRecommendedSource(malId);
    const currentSource = sources[currentSourceIndex];

    // ...

    // Fetch Sources & Initialize Queue
    useEffect(() => {
        let mounted = true;

        const loadSources = async () => {
            // ... existing source loading ...
            const fetched = await scraper.getStreams(malId, Number(episodeNumber), savedProvider || undefined);
            // ...
        };

        const loadProgress = async () => {
            try {
                const saved = await getEpisodeProgress(Number(malId), Number(episodeNumber));
                if (saved && saved.progress > 0) {
                    const progressPercent = saved.progress / (saved.duration || 1);
                    // Only resume if > 30s and < 95% complete
                    if (saved.progress > 30 && progressPercent < 0.95) {
                        setSavedProgress(saved.progress);
                        console.log(`[Player] Found saved progress: ${Math.floor(saved.progress)}s`);
                    }
                }
            } catch (e) {
                console.warn("Failed to load progress", e);
            }
        };

        loadSources();
        loadProgress();

        return () => { mounted = false; };
    }, [malId, episodeNumber]);

    // ...

    const handleStreamSuccess = () => {
        if (testingComplete) return;

        console.log(`Source success: ${currentSource?.quality}`);

        // Update Log: Success
        // ... (existing logging)
        setLogs(prev => {
            const newLogs = [...prev];
            if (newLogs[currentSourceIndex]) {
                newLogs[currentSourceIndex].status = 'success';
            }
            return newLogs;
        });

        setTestingComplete(true);

        // Save to Smart Memory System
        const provider = currentSource?.provider || extractProviderFromQuality(currentSource?.quality);
        if (provider) {
            recordSourceSuccess(malId, provider);
        }

        // Resume INSTANTLY if we have saved progress
        if (savedProgress > 0 && playerRef.current) {
            playerRef.current.currentTime = savedProgress;
            console.log(`[Player] Resumed at ${savedProgress}s`);
        }
    };

    // Manual Source Override - preserves timestamp (Custom player only, no iframe)
    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;

        // Save current timestamp before switching
        if (playerRef.current) {
            setSavedTimestamp(playerRef.current.currentTime || 0);
        }

        // Only allow switching to valid stream sources (no external/iframe)
        const idx = sources.findIndex(s => s.url === val);
        if (idx >= 0) {
            setTestingComplete(true);
            setCurrentSourceIndex(idx);
            setLogs(prev => prev.map((l, i) => ({
                ...l,
                status: i === idx ? 'success' : l.status
            })));
        }
    };

    // Restore timestamp after source switch
    useEffect(() => {
        if (savedTimestamp > 0 && playerRef.current && testingComplete) {
            const restoreTime = () => {
                if (playerRef.current) {
                    playerRef.current.currentTime = savedTimestamp;
                    setSavedTimestamp(0); // Reset after restoring
                }
            };
            // Small delay for player to initialize new source
            const t = setTimeout(restoreTime, 300);
            return () => clearTimeout(t);
        }
    }, [currentSourceIndex, savedTimestamp, testingComplete]);

    // Time update handler
    function onTimeUpdate(detail: any) {
        const time = detail.currentTime;
        setDuration(detail.duration);

        // Skip Button Logic (using AniSkip or prop fallback)
        if (computedIntro && time >= computedIntro.startTime && time < computedIntro.endTime) {
            setShowSkip(true);
            setSkipType("intro");
        } else if (computedOutro && time >= computedOutro.startTime && time < computedOutro.endTime) {
            setShowSkip(true);
            setSkipType("outro");
        } else {
            setShowSkip(false);
        }

        // Smart Auto-Next Logic
        // 1. Prefetch next episode when near end (last 90s)
        if (hasNextEpisode && duration > 0 && time > duration - 90) {
            // Debounced prefetch could be handled by Next.js, but we ensure we call it once
            // (router.prefetch is cheap to call multiple times as Next dedupes)
            router.prefetch(`/watch/${malId}/${nextEpisodeNumber}`);
        }

        // 2. Show "Next Episode" button during Outro or near end
        const isNearEnd = duration > 0 && time > duration - 60;
        const isInOutro = outro && time >= outro.start;

        if ((isNearEnd || isInOutro) && hasNextEpisode) {
            setShowNextButton(true);
        } else {
            setShowNextButton(false);
        }

        // Save Progress
        saveEpisodeProgress(Number(malId), Number(episodeNumber), time, detail.duration);
    }

    function onEnded() {
        if (!isCompleted && anime) {
            setIsCompleted(true);
            markEpisodeComplete({
                ...anime,
                watchedEpisode: Number(episodeNumber),
                duration: duration,
                timestamp: Date.now()
            });
        }

        if (settings.autoNext && hasNextEpisode && !offlineMode) {
            setCountdown(settings.autoNextTimeout);
            setShowAutoNext(true);
        }
    }

    const handleSkip = () => {
        if (!playerRef.current) return;
        let newTime = playerRef.current.currentTime;

        if (skipType === "intro" && computedIntro) {
            newTime = computedIntro.endTime;
        } else if (skipType === "outro" && computedOutro) {
            newTime = computedOutro.endTime;
        }

        playerRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        setShowSkip(false);
    };

    const handleDownload = () => {
        if (currentSource && anime) {
            startDownload(
                currentSource.url,
                malId,
                Number(episodeNumber),
                title,
                image
            );
        }
    };

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (playerRef.current.paused) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (playerRef.current) {
            playerRef.current.currentTime = time;
        }
        setCurrentTime(time);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setVolume(val);
        if (playerRef.current) {
            playerRef.current.volume = val;
        }
        if (val > 0) setIsMuted(false);
    };

    const toggleMute = () => {
        if (!playerRef.current) return;
        const newState = !isMuted;
        setIsMuted(newState);
        playerRef.current.muted = newState;
    };

    const toggleFullscreen = () => {
        if (!playerRef.current) return;
        if (playerRef.current.state.fullscreen) {
            playerRef.current.exitFullscreen();
        } else {
            playerRef.current.enterFullscreen();
        }
    };

    const handleLoadError = () => {
        if (currentSourceIndex < sources.length - 1) {
            setLogs(prev => {
                const newLogs = [...prev];
                if (newLogs[currentSourceIndex]) {
                    newLogs[currentSourceIndex].status = 'failed';
                }
                if (newLogs[currentSourceIndex + 1]) {
                    newLogs[currentSourceIndex + 1].status = 'trying';
                }
                return newLogs;
            });
            setCurrentSourceIndex(prev => prev + 1);
        } else {
            setAllSourcesFailed(true);
        }
    };


    return (
        <div
            data-custom-player="true"
            className={cn(
                "relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group",
                className
            )}
            style={{
                isolation: 'isolate',
                zIndex: 9999,           // Maximum z-index in app
                position: 'relative',   // Ensure positioned for z-index
                contain: 'strict'       // Prevent layout leakage
            }}
        >
            {useFallback && (
                <VidsrcPlayer
                    malId={malId}
                    anilistId={malId} // assuming malId passed here is actually the anilistId or they are mapped
                    episodeNumber={Number(episodeNumber)}
                    title={title}
                    image={image}
                    anime={anime}
                    className="w-full h-full"
                />
            )}

            {!useFallback && (
                <>
                    {/* Connection Status Log Overlay */}
                    {!testingComplete && (
                        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-8 font-mono text-sm">
                            <div className="w-full max-w-md space-y-3">
                                <h3 className="text-zinc-400 border-b border-zinc-800 pb-2 mb-4">Establishing Connection...</h3>
                                {logs.map((log, i) => (
                                    <div key={i} className="flex items-center justify-between gap-4">
                                        <span className={cn(
                                            "truncate max-w-[200px]",
                                            log.status === 'trying' ? "text-white font-bold" : "text-zinc-500"
                                        )}>
                                            {log.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {log.status === 'pending' && <span className="text-zinc-700">Waiting</span>}
                                            {log.status === 'trying' && <span className="text-blue-400 animate-pulse">Connecting...</span>}
                                            {log.status === 'failed' && <span className="text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> Failed</span>}
                                            {log.status === 'success' && <span className="text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> Connected</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Sources Failed Error UI - NO iframe fallback */}
                    {allSourcesFailed && (
                        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-full max-w-md space-y-6">
                                {/* Error Icon */}
                                <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                                    <X className="w-10 h-10 text-red-500" />
                                </div>

                                {/* Error Message */}
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">No Compatible Sources Found</h3>
                                    <p className="text-zinc-400 text-sm">
                                        All available sources use iframe players which are blocked for security and ad-free playback.
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={() => {
                                            setUseFallback(true);
                                        }}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                        </svg>
                                        Try Backup Player (Iframe)
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            // Reset state and retry
                                            setAllSourcesFailed(false);
                                            setTestingComplete(false);
                                            setCurrentSourceIndex(0);
                                            setSources([]);
                                            setLogs([{ name: "Retrying...", status: 'trying' }]);
                                        }}
                                        className="w-full text-zinc-400 hover:text-white hover:bg-white/10"
                                    >
                                        Retry Direct Sources
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            // Copy error report to clipboard
                                            const report = `Source Report\nAnime ID: ${malId}\nEpisode: ${episodeNumber}\nTitle: ${title}\nTimestamp: ${new Date().toISOString()}\nSources Tried: ${logs.map(l => l.name).join(', ')}`;
                                            navigator.clipboard.writeText(report);
                                            alert('Report copied to clipboard!');
                                        }}
                                        className="w-full text-zinc-400 hover:text-white hover:bg-white/10"
                                    >
                                        📋 Copy Report for Support
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        onClick={() => window.history.back()}
                                        className="w-full text-zinc-500 hover:text-zinc-300"
                                    >
                                        ← Go Back
                                    </Button>
                                </div>

                                {/* Technical Details (collapsed) */}
                                <details className="text-left text-xs text-zinc-600">
                                    <summary className="cursor-pointer hover:text-zinc-400">Technical Details</summary>
                                    <div className="mt-2 bg-zinc-900/50 rounded p-3 space-y-1 font-mono">
                                        {logs.map((log, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span className="truncate">{log.name}</span>
                                                <span className={log.status === 'failed' ? 'text-red-500' : 'text-zinc-500'}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        </div>
                    )}

                    {/* Netflix-style Next Episode Button */}
                    {showNextButton && !showAutoNext && (
                        <div className="absolute bottom-20 right-8 z-[60] animate-in slide-in-from-right fade-in duration-500">
                            <Button
                                onClick={playNext}
                                className="bg-white text-black hover:bg-white/90 font-bold px-6 py-6 rounded-lg shadow-xl hover:scale-105 transition-transform flex items-center gap-3"
                            >
                                <span className="flex flex-col items-start">
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Up Next</span>
                                    <span className="text-sm">Episode {nextEpisodeNumber}</span>
                                </span>
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    )}

                    {showAutoNext && (
                        <div className="absolute inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm">
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



                    {/* Custom HTML5 Video Player with HLS.js Support */}
                    {/* @vidstack/react uses native <video> element with automatic HLS.js integration */}
                    <MediaPlayer
                        ref={playerRef}
                        src={{
                            src: currentSource?.url || "",
                            type: currentSource?.isM3U8 ? "application/x-mpegurl" : "video/mp4"
                        }}
                        autoPlay={autoPlay}
                        crossOrigin="anonymous"
                        playsInline
                        title={title || "Anime Stream"}
                        className="w-full h-full"
                        onError={handleLoadError}
                        onCanPlay={handleStreamSuccess}
                        onTimeUpdate={onTimeUpdate}
                        onEnded={onEnded}
                        // Intercept fullscreen to only allow from our player
                        onFullscreenChange={(isFullscreen) => {
                            console.log(`Fullscreen: ${isFullscreen}`);
                        }}
                    >
                        <MediaProvider>
                            {subtitles?.map((sub, i) => (
                                <Track
                                    key={String(i)}
                                    src={sub.url}
                                    kind="subtitles"
                                    label={sub.label}
                                    lang={sub.lang}
                                    default={i === 0}
                                />
                            ))}
                        </MediaProvider>

                        {/* CUSTOM CONTROLS OVERLAY - TV Optimized */}
                        <div
                            className={cn(
                                "absolute inset-0 z-50 flex flex-col justify-between transition-opacity duration-300 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none",
                                showControls ? "opacity-100" : "opacity-0"
                            )}
                        >
                            {/* Header: Back & Title */}
                            <div className="p-8 flex items-center gap-4 pointer-events-auto">
                                <Button
                                    variant="ghost"
                                    className="rounded-full w-12 h-12 hover:bg-white/20 text-white"
                                    onClick={() => router.back()}
                                >
                                    <ArrowRight className="w-6 h-6 rotate-180" />
                                </Button>
                                <div>
                                    <h3 className="text-lg font-bold text-white shadow-black drop-shadow-md">{title}</h3>
                                    <p className="text-zinc-300 text-sm font-medium">Episode {episodeNumber}</p>
                                </div>
                            </div>

                            {/* Center: Play/Pause/Navigation */}
                            <div className="flex-1 flex items-center justify-center pointer-events-auto gap-8">
                                {/* Previous Episode */}
                                {!offlineMode && Number(episodeNumber) > 1 && (
                                    <button
                                        onClick={() => router.push(`/watch/${malId}/${Number(episodeNumber) - 1}`)}
                                        className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/15 backdrop-blur-sm flex items-center justify-center text-white transition-transform hover:scale-110 outline-none"
                                        title="Previous Episode"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" /></svg>
                                    </button>
                                )}

                                {isBuffering ? (
                                    <Loader2 className="w-16 h-16 text-primary animate-spin drop-shadow-lg" />
                                ) : (
                                    <button
                                        onClick={togglePlay}
                                        className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:ring-4 focus-visible:ring-primary outline-none"
                                    >
                                        {isPlaying ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 fill-current" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        )}
                                    </button>
                                )}

                                {/* Next Episode */}
                                {!offlineMode && hasNextEpisode && (
                                    <button
                                        onClick={playNext}
                                        className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/15 backdrop-blur-sm flex items-center justify-center text-white transition-transform hover:scale-110 outline-none"
                                        title="Next Episode"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                                    </button>
                                )}
                            </div>

                            {/* Footer: Controls */}
                            <div className="p-8 space-y-4 pointer-events-auto pb-12">
                                {/* Seek Bar */}
                                <div className="group relative h-2 bg-white/20 rounded-full cursor-pointer hover:h-4 transition-all">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    />
                                    <input
                                        type="range"
                                        min={0}
                                        max={duration || 100}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    {/* Left Controls */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium text-white font-mono">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>

                                        {/* Volume */}
                                        <div className="flex items-center gap-2 group">
                                            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full" onClick={toggleMute}>
                                                {isMuted || volume === 0 ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                                )}
                                            </Button>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={volume}
                                                onChange={handleVolumeChange}
                                                className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Right Controls */}
                                    <div className="flex items-center gap-4">
                                        {/* Sources */}
                                        <select
                                            className="bg-black/50 border border-white/20 text-white text-sm rounded px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none"
                                            value={currentSource?.url || ""}
                                            onChange={handleSourceChange}
                                        >
                                            {sources.map(s => (
                                                <option key={s.url} value={s.url}>
                                                    {s.quality || "Default"} {s.isRecommended ? "★" : ""}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Fullscreen */}
                                        <Button
                                            variant="ghost"
                                            className="text-white hover:bg-white/10 rounded-full w-10 h-10"
                                            onClick={toggleFullscreen}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </MediaPlayer>

                    {/* Skip Button Overlay */}
                    {showSkip && (
                        <div className="absolute bottom-20 right-4 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Button
                                onClick={handleSkip}
                                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-lg gap-2 text-sm font-bold rounded-lg h-10 px-4"
                            >
                                <SkipForward className="h-4 w-4 fill-current" />
                                Skip {skipType === "intro" ? "Intro" : "Outro"}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
