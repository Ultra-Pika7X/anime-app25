"use client";

import { MediaRow } from "@/components/common/MediaRow";
import { useLibrary } from "@/context/LibraryContext";

export default function LibraryPage() {
    const { watchlist, history } = useLibrary();

    // Combine unique items from watchlist and history for "All Library" view, or just show sections
    // Let's show separate rows for clarity

    return (
        <div className="min-h-screen pt-24 pb-10 px-4 md:px-8 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold text-white">My Library</h1>
                <p className="text-gray-400">Your personal collection of anime.</p>
            </header>

            {/* Watchlist Section */}
            {watchlist.length > 0 ? (
                <MediaRow
                    title="Watchlist"
                    items={watchlist.map(item => ({
                        id: Number(item.id),
                        title: item.title,
                        poster_path: item.image,
                        media_type: item.type,
                        vote_average: 0 // Adding placeholder as LibraryItem doesn't strictly track rating
                    }))}
                />
            ) : (
                <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
                    <h2 className="text-xl font-semibold mb-2">Your Watchlist is Empty</h2>
                    <p className="text-gray-400">Add anime to your watchlist to track what you want to see.</p>
                </div>
            )}

            {/* History Section */}
            {history.length > 0 ? (
                <MediaRow
                    title="Continue Watching"
                    items={history.map(item => ({
                        id: Number(item.id),
                        title: item.title,
                        poster_path: item.image,
                        media_type: item.type,
                        vote_average: 0
                    }))}
                />
            ) : (
                <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10 mt-8">
                    <h2 className="text-xl font-semibold mb-2">No History Yet</h2>
                    <p className="text-gray-400">Start watching anime and they will appear here.</p>
                </div>
            )}
        </div>
    );
}
