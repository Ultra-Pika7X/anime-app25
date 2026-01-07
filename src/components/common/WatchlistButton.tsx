"use client";

import { Button } from "@/components/ui/Button";
import { useLibrary } from "@/context/LibraryContext";
import { MediaItem } from "@/types";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // If sonner is installed, otherwise standard alert/console

interface WatchlistButtonProps {
    item: MediaItem;
    className?: string;
    variant?: "default" | "outline" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function WatchlistButton({ item, className, variant = "outline", size = "lg" }: WatchlistButtonProps) {
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useLibrary();
    const inList = isInWatchlist(String(item.id));

    const toggleList = () => {
        if (inList) {
            removeFromWatchlist(String(item.id));
        } else {
            addToWatchlist(item);
        }
    };

    return (
        <Button
            size={size}
            variant={variant}
            onClick={toggleList}
            className={cn(
                "gap-2 font-bold transition-all",
                inList ? "bg-primary text-white border-primary" : "border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white",
                className
            )}
        >
            {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {inList ? "In Watchlist" : "Add to Watchlist"}
        </Button>
    );
}
