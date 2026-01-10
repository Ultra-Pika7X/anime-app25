"use client";

import { useLibrary } from "@/context/LibraryContext";
import { MediaRow } from "@/components/common/MediaRow";
import { useEffect, useState } from "react";

export function ContinueWatchingRow() {
    const { history, mediaList } = useLibrary();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Merge logic:
    // 1. Start with local history
    // 2. Add AniList "CURRENT" items if they aren't already in history or have more progress
    const unifiedHistory = [...history];

    mediaList.forEach((item: any) => {
        if (item.status === "CURRENT") {
            const existingIdx = unifiedHistory.findIndex(h => h.id === item.media.id);
            const mediaItem = {
                id: Number(item.media.id),
                idMal: item.media.idMal,
                title: item.media.title,
                coverImage: item.media.coverImage,
                type: item.media.type || 'ANIME',
                progress: item.progress || 0,
                episodes: item.media.episodes,
                watchedEpisode: item.progress,
                timestamp: Date.now(), // Use current time for sorting AniList items if new
            };

            if (existingIdx === -1) {
                // Not in history, add it
                unifiedHistory.push(mediaItem as any);
            } else {
                // Already in history, keep the one with more progress or newer?
                // Usually AniList is the source of truth for "synced" status
                if ((item.progress || 0) > (unifiedHistory[existingIdx].watchedEpisode || 0)) {
                    unifiedHistory[existingIdx] = {
                        ...unifiedHistory[existingIdx],
                        watchedEpisode: item.progress,
                        progress: item.progress,
                    };
                }
            }
        }
    });

    // Sort by timestamp
    unifiedHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (unifiedHistory.length === 0) return null;

    return (
        <MediaRow
            title="Continue Watching"
            items={unifiedHistory.slice(0, 15)}
        />
    );
}
