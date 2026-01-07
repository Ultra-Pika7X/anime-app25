"use client";

import { useLibrary } from "@/context/LibraryContext";
import { MediaRow } from "@/components/common/MediaRow";

export function CurrentlyWatchingRow() {
    const { mediaList } = useLibrary();

    const currentItems = mediaList
        .filter((item: any) => item.status === "CURRENT")
        .map((item: any) => ({
            id: Number(item.media.id),
            title: item.media.title,
            coverImage: item.media.coverImage,
            type: item.media.type || 'ANIME',
            averageScore: item.media.averageScore,
            episodes: item.media.episodes,
            progress: item.progress,
        }));

    if (currentItems.length === 0) return null;

    return (
        <MediaRow
            title="Currently Watching (AniList)"
            items={currentItems}
        />
    );
}
