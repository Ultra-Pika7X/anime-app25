"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import { imageCache } from "@/lib/imageCache";
import { jikan } from "@/lib/jikan";

interface AnimeImageProps extends Omit<ImageProps, "src"> {
    src?: string | null;
    variants?: (string | null | undefined)[];
    alt: string;
    malId?: string | number | null;
}

export function AnimeImage({ src, variants = [], alt, className, malId, ...props }: AnimeImageProps) {
    const [currentSrc, setCurrentSrc] = useState<string | null>(null);
    const [objectUrl, setObjectUrl] = useState<string | null>(null); // For cached blobs
    const [attemptIndex, setAttemptIndex] = useState(-1);
    const [failed, setFailed] = useState(false);
    const [malAttempted, setMalAttempted] = useState(false);

    // Initial Load Logic
    useEffect(() => {
        let mounted = true;

        const loadWithCache = async (url: string) => {
            if (!url || url.includes("null") || url.includes("undefined")) {
                handleError();
                return;
            }

            try {
                // 1. Try Cache First (Client-side)
                const cachedBlob = await imageCache.get(url);
                if (cachedBlob && mounted) {
                    const objUrl = URL.createObjectURL(cachedBlob);
                    setObjectUrl(objUrl);
                    setCurrentSrc(objUrl);
                    setAttemptIndex(src === url ? -1 : variants.indexOf(url));
                    setFailed(false);
                    return;
                }

                // 2. If not in cache, fallback to normal load but trigger background caching
                if (mounted) {
                    setCurrentSrc(url);
                    setAttemptIndex(src === url ? -1 : variants.indexOf(url));
                    setFailed(false);

                    // Background cache attempt
                    fetch(url, { mode: 'cors' }).then(async (res) => {
                        if (res.ok) {
                            const blob = await res.blob();
                            await imageCache.save(url, blob);
                        }
                    }).catch(() => {
                        // Likely CORS or Network error. Just ignore for caching.
                    });
                }

            } catch (e) {
                // Fallback to normal load without object URL
                if (mounted) {
                    setCurrentSrc(url);
                    setFailed(false);
                }
            }
        };

        const startUrl = src || (variants && variants.length > 0 ? variants.find(v => v) : null);

        if (startUrl) {
            loadWithCache(startUrl);
        } else {
            setFailed(true);
        }

        return () => { mounted = false; };
    }, [src, JSON.stringify(variants)]);

    // Cleanup Object URL effect
    useEffect(() => {
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [objectUrl]);

    const handleError = async () => {
        const nextIndex = attemptIndex + 1;
        if (variants && nextIndex < variants.length) {
            let found = false;
            for (let i = nextIndex; i < variants.length; i++) {
                const v = variants[i];
                if (v && !v.includes("null") && !v.includes("undefined")) {
                    setAttemptIndex(i);
                    setCurrentSrc(v);
                    found = true;
                    break;
                }
            }
            if (!found) {
                if (malId && !malAttempted) {
                    await handleMalFallback();
                } else {
                    setFailed(true);
                }
            }
        } else if (malId && !malAttempted) {
            await handleMalFallback();
        } else {
            setFailed(true);
        }
    };

    const handleMalFallback = async () => {
        setMalAttempted(true);
        try {
            const malImg = await jikan.getAnimeImage(malId!);
            if (malImg) {
                console.log(`[AnimeImage] Falling back to MAL image: ${malImg}`);
                setCurrentSrc(malImg);
                setFailed(false);

                // Background cache attempt for MAL image
                fetch(malImg, { mode: 'cors' }).then(async (res) => {
                    if (res.ok) {
                        const blob = await res.blob();
                        await imageCache.save(malImg, blob);
                    }
                }).catch(() => { });
            } else {
                setFailed(true);
            }
        } catch (e) {
            setFailed(true);
        }
    };

    // Strict Dimension Validation
    const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = event.currentTarget;

        // Reject if dimensions are too small (broken or low-quality fallback)
        // Many AniList broken images are small placeholders
        if (img.naturalWidth < 100 || img.naturalHeight < 100) {
            console.warn(`[AnimeImage] Low quality/broken image rejected: ${currentSrc}`);
            handleError();
        }
    };

    if (failed || !currentSrc) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-[#1a1a1a] text-muted-foreground p-2 text-center overflow-hidden h-full w-full", className)}>
                <div className="rounded-full bg-white/5 p-3 mb-2 animate-in fade-in duration-500">
                    <ImageIcon className="h-6 w-6 opacity-40" />
                </div>
                <span className="text-[10px] font-medium opacity-50 uppercase tracking-widest line-clamp-2 px-2">{alt}</span>
            </div>
        );
    }

    return (
        <Image
            src={currentSrc}
            alt={alt}
            className={cn("bg-muted/20 transition-all duration-700 ease-in-out", className)}
            {...props}
            onLoad={handleLoad}
            onError={handleError}
            // Use unoptimized for blob URLs and potentially all external images to avoid Next.js image optimization overhead/errors
            unoptimized={true}
        />
    );
}
