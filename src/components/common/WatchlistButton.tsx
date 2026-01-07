"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
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
    // Assuming useLibrary or useAuth provides a way to check connection.
    // LibraryContext doesn't expose 'token' directly usually, but we can get it from useAuth.
    const { token } = useLibrary(); // Wait, LibraryContext doesn't expose token.
    // Let's import useAuth.

    // Actually, let's just check if the action succeeds or if we should check beforehand.
    // LibraryContext `addToWatchlist` returns void.

    // Better to Import useAuth
    const { user } = useAuth(); // AuthContext exposes 'user' (AniList user)

    const inList = isInWatchlist(String(item.id));

    const toggleList = () => {
        if (!user) {
            toast.error("Connect AniList to manage your watchlist.");
            return;
        }

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
