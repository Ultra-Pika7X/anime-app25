"use client";

import { MediaRow } from "@/components/common/MediaRow";
import { useLibrary } from "@/context/LibraryContext";
import { List } from "lucide-react";

export default function WatchlistPage() {
    const { watchlist, removeFromWatchlist } = useLibrary();

    return (
        <div className="min-h-screen pt-24 pb-10 px-4 md:px-8 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
                <p className="text-gray-400">Anime you plan to watch.</p>
            </header>

            {watchlist.length > 0 ? (
                <MediaRow
                    title="" // No title needed
                    items={watchlist.map(item => ({
                        id: Number(item.id),
                        title: item.title,
                        poster_path: item.image,
                        media_type: item.type,
                        vote_average: 0
                    }))}
                />
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <List size={40} className="text-gray-400" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
                    <p className="text-gray-400 max-w-md">
                        Save anime you want to watch later and they will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
