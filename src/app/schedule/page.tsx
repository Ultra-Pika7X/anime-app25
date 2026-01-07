"use client";

import { useQuery } from "@tanstack/react-query";
import { anilist } from "@/lib/anilist";
import { useState } from "react";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";
import { format, startOfDay, endOfDay, getUnixTime } from "date-fns";
import { MediaCard } from "@/components/common/MediaCard";
import { Loader2 } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";

export default function SchedulePage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { mediaList, addToWatchlist, isInWatchlist } = useLibrary();

    const { data, isLoading } = useQuery({
        queryKey: ["schedule", format(selectedDate, 'yyyy-MM-dd')],
        queryFn: async () => {
            const start = getUnixTime(startOfDay(selectedDate));
            const end = getUnixTime(endOfDay(selectedDate));
            return anilist.getAiringSchedule(start, end, 1, 50);
        }
    });

    const schedule = data?.Page?.airingSchedules || [];

    // Helper to format airing time
    const formatTime = (timestamp: number) => {
        return format(new Date(timestamp * 1000), 'h:mm a');
    };

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 space-y-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        Airing Schedule
                    </h1>
                    <p className="text-zinc-400">Keep track of new episodes airing today.</p>
                </div>

                <ScheduleCalendar
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : schedule.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {schedule.map((item: any) => {
                            const isTracked = isInWatchlist(item.media.id);

                            return (
                                <div key={item.id} className="group relative bg-zinc-900/40 rounded-xl p-4 border border-white/5 hover:border-primary/50 transition-colors flex gap-4 overflow-hidden">
                                    {/* Time Stripe */}
                                    {isTracked && (
                                        <div className="absolute top-0 right-0 p-2">
                                            <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-primary/20">
                                                My List
                                            </span>
                                        </div>
                                    )}

                                    <div className="w-[80px] flex-shrink-0">
                                        <div className="aspect-[2/3] relative rounded-md overflow-hidden shadow-lg">
                                            <img
                                                src={item.media.coverImage.large}
                                                alt={item.media.title.english || item.media.title.romaji}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center min-w-0 pointer-events-none group-hover:pointer-events-auto">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-bold text-white tabular-nums">
                                                {formatTime(item.airingAt)}
                                            </span>
                                            <span className="text-zinc-500 text-xs font-medium px-2 py-0.5 bg-white/5 rounded">
                                                EP {item.episode}
                                            </span>
                                        </div>

                                        <h3 className="font-semibold text-zinc-200 line-clamp-2 text-sm leading-tight mb-2 group-hover:text-primary transition-colors">
                                            {item.media.title.english || item.media.title.romaji}
                                        </h3>

                                        <div className="flex items-center gap-2 mt-auto">
                                            <a
                                                href={`/anime/${item.media.id}`}
                                                className="text-xs font-medium text-zinc-500 hover:text-white transition-colors"
                                            >
                                                Details
                                            </a>
                                            {!isTracked && (
                                                <button
                                                    onClick={() => addToWatchlist(item.media)}
                                                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                                >
                                                    + Track
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                            <span className="text-2xl">💤</span>
                        </div>
                        <h3 className="text-xl font-medium text-white">No episodes airing today</h3>
                        <p className="text-zinc-500 max-w-md">
                            Take a break! Or verify if you have traveled to the future.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
