"use client";

import { useState } from "react";
import { MediaRow } from "@/components/common/MediaRow";
import { useLibrary } from "@/context/LibraryContext";
import { List, PlayCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
    { id: "CURRENT", label: "Watching", icon: PlayCircle },
    { id: "PLANNING", label: "Planned", icon: Clock },
    { id: "COMPLETED", label: "Completed", icon: CheckCircle },
    { id: "DROPPED", label: "Dropped", icon: XCircle },
];

export default function WatchlistPage() {
    const { mediaList } = useLibrary();
    const [activeTab, setActiveTab] = useState("CURRENT");

    const filteredItems = mediaList
        .filter((item: any) => item.status === activeTab)
        .map((item: any) => ({
            id: Number(item.media.id),
            title: item.media.title,
            coverImage: item.media.coverImage,
            type: item.media.type || 'ANIME',
            averageScore: item.media.averageScore,
            episodes: item.media.episodes,
            progress: item.progress,
        }));

    return (
        <div className="min-h-screen pt-24 pb-10 px-4 md:px-8 space-y-8 container mx-auto">
            <header className="space-y-4">
                <h1 className="text-3xl font-bold text-white">My Library</h1>

                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-purple-600 text-white"
                                    : "bg-zinc-900/50 text-gray-400 hover:bg-zinc-800 hover:text-white"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            <span className="ml-1 opacity-60 text-xs">
                                ({mediaList.filter((i: any) => i.status === tab.id).length})
                            </span>
                        </button>
                    ))}
                </div>
            </header>

            {filteredItems.length > 0 ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MediaRow
                        title={`${TABS.find(t => t.id === activeTab)?.label} Anime`}
                        items={filteredItems}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <List size={40} className="opacity-50" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No anime found</h2>
                    <p className="max-w-md">
                        This list is empty. Go add some anime!
                    </p>
                </div>
            )}
        </div>
    );
}
