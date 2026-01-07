
"use client";

import { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Track, type MediaPlayerInstance } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { Button } from "@/components/ui/Button";
import { SkipForward, DownloadCloud, Loader2, Check, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/context/LibraryContext";
import { useDownloads } from "@/context/DownloadContext";
import { useAuth } from "@/context/AuthContext";
import { MediaItem } from "@/types";
import { useRouter } from "next/navigation";
import { recordSourceSuccess, recordSourceFailure, sortSourcesByRecommendation, getRecommendedSource } from "@/lib/sourceMemory";
import { scraper, StreamSource } from "@/lib/scraper";

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
    useEffect(() => {
        let mounted = true;

        const loadSources = async () => {
            if (!mounted) return;
            setLogs([{ name: "Fetching sources...", status: "trying" }]);

            try {
                // Determine saved preference to sort
                const prefKey = `anime_source_pref_${malId}`;
                const savedProvider = typeof window !== 'undefined' ? localStorage.getItem(prefKey) : null;

                const fetched = await scraper.getStreams(malId, Number(episodeNumber), savedProvider || undefined);

                if (!mounted) return;

                if (fetched && fetched.length > 0) {
                    // Sort by smart memory (last successful source first)
                    const sorted = sortSourcesByRecommendation(malId, fetched);

                    // Get recommended source from memory
                    const recommendedProvider = getRecommendedSource(malId);

                    // Mark sources with recommendation status
                    const marked: Source[] = sorted.map((s, i) => ({
                        ...s,
                        isRecommended: i === 0 || (!!s.provider && s.provider === recommendedProvider)
                    }));

                    // Create Logs
                    const initialLogs: { name: string; status: 'pending' | 'trying' | 'failed' | 'success' }[] = marked.map(s => ({
                        name: `${s.quality || 'Source'}${s.isRecommended ? ' ⭐' : ''}`,
                        status: 'pending'
                    }));

                    // Start with first (which is now the recommended one)
                    initialLogs[0].status = 'trying';

                    setSources(marked);
                    setLogs(initialLogs);
                    setCurrentSourceIndex(0);
                } else {
                    setLogs(prev => [...prev.map(l => ({ ...l, status: 'failed' as const })), { name: "No sources found", status: 'failed' }]);
                }
            } catch (e) {
                if (mounted) {
                    setLogs(prev => [...prev, { name: "Error loading sources", status: 'failed' }]);
                }
            }
        };

        loadSources();
        return () => { mounted = false; };
    }, [malId, episodeNumber]);

    // Source Validation: Check if URL is a valid direct stream
    const validateSource = (source: Source | undefined): { valid: boolean; reason?: string } => {
        if (!source) return { valid: false, reason: "No source provided" };

        const url = source.url || '';

        // Must have a URL
        if (!url) {
            return { valid: false, reason: "Empty URL" };
        }

        // Must be HTTP/HTTPS
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return { valid: false, reason: "Invalid protocol (not HTTP/HTTPS)" };
        }

        // Check for iframe/embed patterns (BLOCKED)
        const blockedPatterns = [
            '/embed',
            '/iframe',
            'player.html',
            'vidsrc.to',
            'vidsrc.me',
            'streamtape.com/e/',
            'filemoon.',
            'vidcloud.',
            'doodstream.',
            'mp4upload.',
            'mixdrop.'
        ];

        for (const pattern of blockedPatterns) {
            if (url.toLowerCase().includes(pattern)) {
                return { valid: false, reason: `Blocked pattern: ${pattern}` };
            }
        }

        // Valid stream patterns
        const validPatterns = [
            '.m3u8',      // HLS
            '.mpd',       // DASH
            '.mp4',       // Direct MP4
            '.webm',      // WebM
            'master.m3u8',
            'index.m3u8',
            'playlist.m3u8'
        ];

        const hasValidExtension = validPatterns.some(p => url.toLowerCase().includes(p));
        const hasM3U8Flag = source.isM3U8 === true;

        if (hasValidExtension || hasM3U8Flag) {
            return { valid: true };
        }

        // If none of the above, still allow if it looks like a stream URL
        // (some providers use query params instead of extensions)
        if (url.includes('?') && (url.includes('video') || url.includes('stream'))) {
            return { valid: true };
        }

        return { valid: false, reason: "Not a recognized stream format" };
    };

    // Handle Source Updates (When index changes) - with pre-playback validation
    const currentSource = sources[currentSourceIndex];

    // Pre-playback validation: Check source before attempting to play
    useEffect(() => {
        if (testingComplete || sources.length === 0) return;

        const source = sources[currentSourceIndex];
        const validation = validateSource(source);

        if (!validation.valid) {
            console.warn(`⚠️ Source incompatible: ${source?.quality || 'Unknown'} - ${validation.reason}`);

            // Determine user-friendly message
            const isIframeBlocked = validation.reason?.includes('Blocked pattern') ||
                validation.reason?.includes('embed') ||
                validation.reason?.includes('iframe');
            const userMessage = isIframeBlocked
                ? "Incompatible (iframe blocked)"
                : "Incompatible";

            // Update log with failure reason - continue without interruption
            setLogs(prev => {
                const newLogs = [...prev];
                if (newLogs[currentSourceIndex]) {
                    newLogs[currentSourceIndex].status = 'failed';
                    newLogs[currentSourceIndex].name = `${source?.quality || 'Source'} - ${userMessage}`;
                }
                // Prepare next - continue searching automatically
                if (newLogs[currentSourceIndex + 1]) {
                    newLogs[currentSourceIndex + 1].status = 'trying';
                }
                return newLogs;
            });

            // Record failure
            const provider = source?.provider || extractProviderFromQuality(source?.quality);
            if (provider) {
                recordSourceFailure(malId, provider);
            }

            // Move to next source automatically - no user interruption
            if (currentSourceIndex < sources.length - 1) {
                setCurrentSourceIndex(prev => prev + 1);
            } else {
                // All sources failed validation - no iframe fallback
                console.error("❌ All sources failed validation - no compatible streams found");
                setAllSourcesFailed(true);
            }
        } else {
            console.log(`✅ Source valid: ${source?.quality || 'Unknown'}`);
        }
    }, [currentSourceIndex, sources, testingComplete, malId]);

    const handleLoadError = () => {
        if (testingComplete) return;

        console.warn(`Source failed: ${currentSource?.quality}`);

        // Update Log: Failed
        setLogs(prev => {
            const newLogs = [...prev];
            if (newLogs[currentSourceIndex]) {
                newLogs[currentSourceIndex].status = 'failed';
            }
            // Prepare next
            if (newLogs[currentSourceIndex + 1]) {
                newLogs[currentSourceIndex + 1].status = 'trying';
            }
            return newLogs;
        });

        // Record failure in memory
        const provider = currentSource?.provider || extractProviderFromQuality(currentSource?.quality);
        if (provider) {
            recordSourceFailure(malId, provider);
        }

        // Move to next
        if (currentSourceIndex < sources.length - 1) {
            setCurrentSourceIndex(prev => prev + 1);
        } else {
            // All failed - no iframe fallback
            console.error("❌ All sources exhausted");
            setAllSourcesFailed(true);
        }
    };

    // Helper to extract provider from quality string
    const extractProviderFromQuality = (quality?: string): string | null => {
        if (!quality) return null;
        const match = quality.match(/\(([^)]+)\)/);
        return match ? match[1] : null;
    };

    const handleStreamSuccess = () => {
        if (testingComplete) return;

        console.log(`Source success: ${currentSource?.quality}`);

        // Update Log: Success
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

        // Resume from saved progress
        const resumeFromSaved = async () => {
            try {
                const saved = await getEpisodeProgress(Number(malId), Number(episodeNumber));
                if (saved && saved.progress > 0 && playerRef.current) {
                    const progressPercent = saved.progress / (saved.duration || 1);
                    // Resume if > 30s and < 95% complete
                    if (saved.progress > 30 && progressPercent < 0.95) {
                        playerRef.current.currentTime = saved.progress;
                        console.log(`Resumed playback at ${Math.floor(saved.progress)}s`);
                    }
                }
            } catch (e) {
                console.warn("Failed to resume progress", e);
            }
        };

        // Delay to allow player to initialize
        setTimeout(resumeFromSaved, 500);
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

        // Skip Button Logic
        if (intro && time >= intro.start && time < intro.end) {
            setShowSkip(true);
            setSkipType("intro");
        } else if (outro && time >= outro.start && time < outro.end) {
            setShowSkip(true);
            setSkipType("outro");
        } else {
            setShowSkip(false);
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
        if (skipType === "intro" && intro) {
            playerRef.current.currentTime = intro.end;
        } else if (skipType === "outro" && outro) {
            playerRef.current.currentTime = outro.end;
        }
        setShowSkip(false);
    };

    const handleDownload = () => {
        // ... existing implementation ...
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
                                    // Reset state and retry
                                    setAllSourcesFailed(false);
                                    setTestingComplete(false);
                                    setCurrentSourceIndex(0);
                                    setSources([]);
                                    setLogs([{ name: "Retrying...", status: 'trying' }]);
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                    <path d="M21 3v5h-5" />
                                </svg>
                                Retry Sources
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

            {/* Auto Next Overlay */}
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

            {/* Player Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.history.back()}
                        className="text-white hover:bg-white/10 rounded-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-white shadow-black drop-shadow-md">
                            {title || "Anime Stream"}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Download Button */}
                    {!offlineMode && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDownload}
                            disabled={isDownloading || isDownloaded}
                            className="text-white hover:bg-white/10"
                            title={isDownloaded ? "Downloaded" : "Download Episode"}
                        >
                            {isDownloading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                            ) : isDownloaded ? (
                                <Check className="w-5 h-5 text-green-500" />
                            ) : (
                                <DownloadCloud className="w-5 h-5" />
                            )}
                        </Button>
                    )}

                    {!offlineMode && testingComplete && (
                        <select
                            className="bg-black/50 text-white border border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium backdrop-blur-md outline-none cursor-pointer hover:bg-black/70 transition-colors min-w-[160px]"
                            onChange={handleSourceChange}
                            value={currentSource?.url || ""}
                        >
                            {sources?.map((s, i) => (
                                <option key={i} value={s.url}>
                                    {s.isRecommended ? "⭐ " : ""}
                                    {s.quality || "Auto"}
                                    {s.isRecommended ? " (Recommended)" : ""}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

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

                {/* Custom UI Controls - replaces any source-hosted controls */}
                <DefaultVideoLayout icons={defaultLayoutIcons} />
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
        </div>
    );
}
