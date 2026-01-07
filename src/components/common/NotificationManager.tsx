"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { anilist } from "@/lib/anilist";
import { useLibrary } from "@/context/LibraryContext";
import { toast } from "sonner";
import { differenceInMinutes } from "date-fns";

export function NotificationManager() {
    const { mediaList } = useLibrary();

    // Check for "Recent Episodes" periodically
    // We fetch the first page of recent episodes (usually cached by anilist.ts)
    const { data: recent } = useQuery({
        queryKey: ["notifications_recent"],
        queryFn: () => anilist.getRecentEpisodes(1, 20),
        refetchInterval: 1000 * 60 * 15, // Check every 15 minutes
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (!recent?.Page?.media || !mediaList || mediaList.length === 0) return;

        const checkKey = "last_notification_check";
        const lastCheck = parseInt(localStorage.getItem(checkKey) || "0");
        const now = Date.now();

        // Prevent spam: only toast if we haven't checked int he last 5 minutes
        if (now - lastCheck < 1000 * 60 * 5) return;

        // Filter new episodes matching user's watchlist (CURRENT only)
        const recentShows = recent.Page.media;

        const newEpisodes = recentShows.filter((show: any) => {
            const userEntry = mediaList.find((entry: any) => entry.media.id === show.id);
            // Must be in "CURRENT" list
            if (!userEntry || userEntry.status !== "CURRENT") return false;

            // Check if this update is "new" relative to last check?
            // Since AniList doesn't give exact "releasedAt" for the episode easily in this query,
            // we rely on the fact that it's in "Recent" list. 
            // Better logic: Store "last seen episode" for each show?
            // For now: Simple "New Episode Available" if it's in recent list and user is behind?

            // Logic: If user progress < show total episodes (or current episode)
            // But "show.episodes" might be null for ongoing.
            // Let's rely on `nextAiringEpisode` being null (meaning it just aired) or just general presence.

            // Refined Logic:
            // Warn user if we haven't notified them about this specific episode yet.
            // We can store `last_notified_${animeId}` = episodeNumber.

            const lastNotifiedEp = parseInt(localStorage.getItem(`last_notified_${show.id}`) || "0");
            // We need to guess the episode number. 
            // In `getRecentEpisodes` query, we requested `episodes`. 
            // Often "episodes" field is total. 
            // Only `nextAiringEpisode` tells us what's next. 
            // `airingSchedules` is better for this. But `RecentEpisodes` implies the *latest* aired.
            // Let's assume if it appears here, it's fresh. 
            // We will just show a notification "New Episode for [Title]" once per day per show?

            const lastNotifiedTime = parseInt(localStorage.getItem(`last_notified_time_${show.id}`) || "0");
            // If notified in last 24h, skip
            if (Date.now() - lastNotifiedTime < 1000 * 60 * 60 * 24) return false;

            return true;
        });

        if (newEpisodes.length > 0) {
            newEpisodes.forEach((show: any) => {
                toast.success(`New Episode Available!`, {
                    description: `${show.title.english || show.title.romaji} has aired.`,
                    action: {
                        label: "Watch",
                        onClick: () => window.location.href = `/anime/${show.id}`
                    }
                });

                // Mark notified
                localStorage.setItem(`last_notified_time_${show.id}`, Date.now().toString());
            });

            // Update global check
            localStorage.setItem(checkKey, now.toString());
        }

    }, [recent, mediaList]);

    return null; // Headless component
}
