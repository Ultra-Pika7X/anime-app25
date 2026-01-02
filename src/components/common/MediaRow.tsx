"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard } from "./MediaCard";
import { MediaItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface MediaRowProps {
    title: string;
    items: MediaItem[];
    type?: "movie" | "tv";
}

export function MediaRow({ title, items, type }: MediaRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { clientWidth, scrollLeft } = rowRef.current;
            const scrollTo =
                direction === "left"
                    ? scrollLeft - clientWidth / 2
                    : scrollLeft + clientWidth / 2;

            rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="space-y-4 py-8">
            <div className="flex items-center justify-between px-6 md:px-12">
                <h2 className="text-2xl font-black tracking-tighter text-white">
                    {title}
                </h2>
                <div className="h-px flex-1 bg-white/5 mx-6 hidden md:block" />
            </div>

            <div className="group relative">
                <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center bg-gradient-to-r from-background via-background/60 to-transparent px-4 opacity-0 transition-all duration-300 group-hover:opacity-100 disabled:opacity-0 pointer-events-none">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full border-white/10 bg-black/40 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/20 transition-all pointer-events-auto"
                        onClick={() => scroll("left")}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </div>

                <div
                    ref={rowRef}
                    className="flex gap-6 overflow-x-auto px-6 pb-6 pt-2 scrollbar-hide md:px-12"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {items.map((item) => (
                        <div key={item.id} className="w-[160px] flex-none md:w-[220px]">
                            <MediaCard item={item} type={type || item.media_type as "movie" | "tv"} />
                        </div>
                    ))}
                </div>

                <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-center bg-gradient-to-l from-background via-background/60 to-transparent px-4 opacity-0 transition-all duration-300 group-hover:opacity-100 pointer-events-none">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full border-white/10 bg-black/40 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/20 transition-all pointer-events-auto"
                        onClick={() => scroll("right")}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
