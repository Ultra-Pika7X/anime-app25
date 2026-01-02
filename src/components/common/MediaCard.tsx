import Image from "next/image";
import Link from "next/link";
import { MediaItem } from "@/types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface MediaCardProps {
    item: MediaItem;
    className?: string;
    type?: "movie" | "tv";
}

export function MediaCard({ item, className, type }: MediaCardProps) {
    const title = item.title || item.name || "Untitled";
    const date = item.release_date || item.first_air_date;
    const year = date ? new Date(date).getFullYear() : "";
    const mediaType = type || item.media_type || "movie";
    const href = `/${mediaType}/${item.id}`;

    return (
        <Link
            href={href}
            className={cn("group relative flex flex-col gap-2 transition-all duration-300", className)}
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[--radius] bg-muted shadow-lg bg-[#111111]">
                {item.poster_path ? (
                    <Image
                        src={item.poster_path.startsWith("http") ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`}
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

                {/* Overlay Content on Hover */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-4 text-center">
                    <div className="bg-primary/90 text-white rounded-full p-2 mb-2 scale-50 group-hover:scale-100 transition-transform duration-300">
                        <Star className="h-6 w-6 fill-current" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{item.vote_average ? `${item.vote_average.toFixed(1)} / 10` : "N/A"}</p>
                    <p className="text-xs text-white/70 uppercase tracking-widest">{mediaType}</p>
                </div>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2 z-20">
                    <span className="rounded-[4px] bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md border border-white/10 uppercase">
                        HD
                    </span>
                </div>

                {item.vote_average ? (
                    <div className="absolute bottom-2 right-2 rounded-[4px] bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm z-20 shadow-lg">
                        {item.vote_average.toFixed(1)}
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
                        {item.genres ? item.genres.map(g => g.name).join(", ") : mediaType}
                    </span>
                </div>
            </div>
        </Link>
    );
}
