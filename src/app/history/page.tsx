"use client";

import { MediaRow } from "@/components/common/MediaRow";
import { useLibrary } from "@/context/LibraryContext";
import { Trash2 } from "lucide-react";

export default function HistoryPage() {
    const { history, clearHistory } = useLibrary();

    return (
        <div className="min-h-screen pt-24 pb-10 px-4 md:px-8 space-y-8">
            <header className="flex justify-between items-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">Watch History</h1>
                    <p className="text-gray-400">Resume from where you left off.</p>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={clearHistory}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                    >
                        <Trash2 size={16} />
                        Clear History
                    </button>
                )}
            </header>

            {history.length > 0 ? (
                <MediaRow
                    title="" // No title needed as header says "Watch History"
                    items={history.map(item => ({
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
                        <span className="text-3xl">🕰️</span>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No watch history</h2>
                    <p className="text-gray-400 max-w-md">
                        Your watch history is empty. Start watching anime to keep track of your progress.
                    </p>
                </div>
            )}
        </div>
    );
}
