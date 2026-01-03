
"use client";

import { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Track, type MediaPlayerInstance } from "@vidstack/react";
import { DefaultVideoLayout, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { Button } from "@/components/ui/Button";
import { SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimePlayerProps {
    source: string; // m3u8 url
    subtitles?: { url: string; lang: string; label: string }[];
    intro?: { start: number; end: number };
    outro?: { start: number; end: number };
    className?: string;
    autoPlay?: boolean;
}

export function AnimePlayer({ source, subtitles, intro, outro, className, autoPlay = false }: AnimePlayerProps) {
    const playerRef = useRef<MediaPlayerInstance>(null);
    const [showSkip, setShowSkip] = useState(false);
    const [skipType, setSkipType] = useState<"intro" | "outro">("intro");

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

    return (
        <div className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl", className)}>
            <MediaPlayer
                ref={playerRef}
                src={source}
                autoPlay={autoPlay}
                title="Anime Stream"
                className="w-full h-full"
            >
                <MediaProvider>
                    {subtitles?.map((sub, i) => (
                        <Track
                            key={i}
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
