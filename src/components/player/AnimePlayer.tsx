
"use client";

import { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Track, type MediaPlayerInstance } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { Button } from "@/components/ui/Button";
import { SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
    url: string;
    quality?: string;
    isM3U8: boolean;
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
}

export function AnimePlayer({
    sources,
    subtitles,
    intro,
    outro,
    className,
    autoPlay = false,
    malId,
    episodeNumber
}: AnimePlayerProps) {
    const playerRef = useRef<MediaPlayerInstance>(null);
    const [showSkip, setShowSkip] = useState(false);
    const [skipType, setSkipType] = useState<"intro" | "outro">("intro");

    // State for current source. Default to the first "default" or "auto" quality, or just the first source.
    const [currentSource, setCurrentSource] = useState<Source | null>(null);
    const [useIframe, setUseIframe] = useState(false);

    // Initialize source
    useEffect(() => {
        if (sources && sources.length > 0) {
            const defaultSource = sources.find(s => s.quality === "default" || s.quality === "auto") || sources[0];
            setCurrentSource(defaultSource);
            setUseIframe(false);
        } else {
            setUseIframe(true); // No sources? Use fallback.
        }
    }, [sources]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!playerRef.current) return;
            const time = playerRef.current.currentTime;

            // Check Intro
            if (intro && time >= intro.start && time < intro.end) {
                setSkipType("intro");
                setShowSkip(true);
            }
            // Check Outro
            else if (outro && time >= outro.start && time < outro.end) {
                setSkipType("outro");
                setShowSkip(true);
            } else {
                setShowSkip(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [intro, outro]);

    const handleSkip = () => {
        if (!playerRef.current) return;
        const target = skipType === "intro" ? intro?.end : outro?.end;
        if (target) {
            playerRef.current.currentTime = target;
            setShowSkip(false);
        }
    };

    const handleLoadError = () => {
        console.warn("Internal Player failed to load source. Switching to Iframe Fallback.");
        setUseIframe(true);
    };

    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === "external") {
            setUseIframe(true);
        } else {
            const selected = sources?.find(s => s.url === value);
            if (selected) {
                setCurrentSource(selected);
                setUseIframe(false);
            }
        }
    };

    if (useIframe) {
        // Fallback: VidSrc.cc Embed
        // Added sandbox to block popup ads while allowing necessary script execution
        const iframeSrc = `https://vidsrc.cc/v2/embed/anime/${malId}/${episodeNumber}/sub`;

        return (
            <div className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group", className)}>
                {/* Source Selector Overlay (even in iframe mode) */}
                <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select
                        className="bg-black/70 text-white border border-white/20 rounded px-2 py-1 text-sm backdrop-blur-md outline-none cursor-pointer hover:bg-black/90"
                        onChange={handleSourceChange}
                        value="external"
                    >
                        {sources?.map((s, i) => (
                            <option key={i} value={s.url}>
                                {s.quality === "default" || s.quality === "auto" ? "Native Player (Auto)" : `Native Player (${s.quality})`}
                            </option>
                        ))}
                        <option value="external">External Player (Ads)</option>
                    </select>
                </div>

                <iframe
                    src={iframeSrc}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    // Sandbox: allow-scripts is needed for the player to work. 
                    // We remove 'allow-popups' to try and block new windows.
                    sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
                />
            </div>
        );
    }

    return (
        <div className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group", className)}>

            {/* Source Selector Overlay */}
            <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <select
                    className="bg-black/70 text-white border border-white/20 rounded px-2 py-1 text-sm backdrop-blur-md outline-none cursor-pointer hover:bg-black/90"
                    onChange={handleSourceChange}
                    value={currentSource?.url || ""}
                >
                    {sources?.map((s, i) => (
                        <option key={i} value={s.url}>
                            {s.quality === "default" || s.quality === "auto" ? "Native Player (Auto)" : `Native Player (${s.quality})`}
                        </option>
                    ))}
                    <option value="external">External Player (Ads)</option>
                </select>
            </div>

            <MediaPlayer
                ref={playerRef}
                src={currentSource?.url || ""}
                autoPlay={autoPlay}
                title="Anime Stream"
                className="w-full h-full"
                onError={handleLoadError}
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

                {/* Standard Layout */}
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
