import Image from "next/image";
import Link from "next/link";
import { MediaItem } from "@/types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface MediaCardProps {
    item: MediaItem;
    className?: string;
    type?: "movie" | "tv"; // Kept for compatibility but mostly unused for routing now if we unify
}

export function MediaCard({ item, className, type }: MediaCardProps) {
    const title = item.title?.english || item.title?.romaji || item.title?.native || "Untitled";
    const year = item.seasonYear || "";
    const mediaType = "anime"; // or use item.format
    const href = `/watch/${item.id}`; // Direct to watch page for now

    return (
        <Link
            href={href}
            className={cn("group relative flex flex-col gap-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[--radius]", className)}
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[--radius] bg-muted shadow-lg bg-[#111111]">
                {item.coverImage?.extraLarge || item.coverImage?.large ? (
                    <Image
                        src={item.coverImage.extraLarge || item.coverImage.large}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:opacity-40"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                        No Image
                    </div>
                )}

                {/* Overlay Content on Hover or Focus */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 p-4 text-center">
                    <div className="bg-primary/90 text-white rounded-full p-2 mb-2 scale-50 group-hover:scale-100 group-focus-visible:scale-100 transition-transform duration-300">
                        <Star className="h-6 w-6 fill-current" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{item.averageScore ? `${(item.averageScore / 10).toFixed(1)} / 10` : "N/A"}</p>
                    <p className="text-xs text-white/70 uppercase tracking-widest">{item.format || "TV"}</p>
                </div>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2 z-20">
                    <span className="rounded-[4px] bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/10 uppercase">
                        HD
                    </span>
                    {item.nextAiringEpisode && (
                        <span className="rounded-[4px] bg-primary/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                            EP {item.nextAiringEpisode.episode}
                        </span>
                    )}
                </div>

                {item.averageScore ? (
                    <div className="absolute bottom-2 right-2 rounded-[4px] bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm z-20 shadow-lg">
                        {(item.averageScore / 10).toFixed(1)}
                    </div>
                ) : null}
            </div>

            <div className="flex flex-col gap-0.5 mt-1 px-1">
                <h3 className="truncate text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors tracking-tight">
                    {title}
                </h3>
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[11px] font-medium text-muted-foreground shrink-0">{year}</span>
                    <span className="text-[11px] text-muted-foreground/40 shrink-0">•</span>
                    <span className="truncate text-[11px] font-medium text-muted-foreground/60 uppercase tracking-tighter">
                        {item.genres ? item.genres.slice(0, 2).join(", ") : mediaType}
                    </span>
                </div>
            </div>
        </Link>
    );
}
