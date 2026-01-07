"use client";

import { useEffect, useState } from "react";
import { anilist } from "@/lib/anilist";
import { MediaCard } from "@/components/common/MediaCard";
import { useLibrary } from "@/context/LibraryContext";
import { cn } from "@/lib/utils";
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addDays, startOfDay, getDay } from "date-fns";
import { Button } from "@/components/ui/Button";

interface AiringEpisode {
    id: number;
    airingAt: number;
    episode: number;
    media: any;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulePage() {
    const { isInWatchlist } = useLibrary();
    const [schedule, setSchedule] = useState<Record<number, AiringEpisode[]>>({});
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(getDay(new Date())); // Default to today

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                // Fetch for a wide range (e.g., -1 to +7 days) to cover all timezones well
                // Actually, let's just do start of today to +6 days (7 days total)
                const now = new Date();
                const start = Math.floor(startOfDay(now).getTime() / 1000);
                const end = Math.floor(addDays(startOfDay(now), 7).getTime() / 1000);

                // We might needpagination if there are tons, but a week usually fits in one or two standard request pages (50 per page).
                // Let's fetch 2 pages to be safe (100 items).
                const data1 = await anilist.getAiringSchedule(start, end, 1, 50);
                const data2 = data1?.Page?.pageInfo?.hasNextPage
                    ? await anilist.getAiringSchedule(start, end, 2, 50)
                    : null;

                let all: AiringEpisode[] = data1?.Page?.airingSchedules || [];
                if (data2?.Page?.airingSchedules) {
                    all = [...all, ...data2.Page.airingSchedules];
                }

                // Group by Day of Week (Local Time)
                const grouped: Record<number, AiringEpisode[]> = {};
                all.forEach(item => {
                    const date = new Date(item.airingAt * 1000);
                    const day = getDay(date);
                    if (!grouped[day]) grouped[day] = [];
                    grouped[day].push(item);
                });

                // Sort by time within day
                Object.keys(grouped).forEach(key => {
                    grouped[Number(key)].sort((a, b) => a.airingAt - b.airingAt);
                });

                setSchedule(grouped);
            } catch (e) {
                console.error("Failed to fetch schedule", e);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    // Create ordered list of days starting from today for the tabs?
    // Or just standard Sun-Sat order?
    // User usually wants to see "Today" first.
    // Let's rearrange days array to start with SelectedDay? No, just keep standard order but select Today.
    // Or maybe separate "Today" from others.

    // Let's use standard order for Tabs, but scroll to active?

    return (
        <div className="min-h-screen pt-24 pb-20 container animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <CalendarIcon className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">Airing Schedule</h1>
            </div>

            {/* Day Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-2 mb-8 no-scrollbar mask-linear-fade">
                {DAYS.map((dayName, index) => {
                    const isActive = selectedDay === index;
                    const isToday = index === getDay(new Date());
                    return (
                        <Button
                            key={dayName}
                            variant={isActive ? "default" : "outline"}
                            onClick={() => setSelectedDay(index)}
                            className={cn(
                                "whitespace-nowrap px-6 rounded-full transition-all",
                                isActive ? "shadow-lg shadow-primary/25" : "hover:bg-white/10"
                            )}
                        >
                            {dayName} {isToday && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-white/20 rounded">TODAY</span>}
                        </Button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {schedule[selectedDay]?.length > 0 ? (
                        schedule[selectedDay].map((item) => {
                            const isMyList = isInWatchlist(item.media.id);
                            const time = format(new Date(item.airingAt * 1000), "h:mm a");

                            return (
                                <div key={item.id} className="relative group">
                                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground font-mono">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {time}
                                        </div>
                                        <span className="text-primary font-bold">Ep {item.episode}</span>
                                    </div>

                                    <div className={cn("relative p-0.5 rounded-xl transition-all", isMyList ? "bg-gradient-to-br from-primary via-purple-500 to-blue-500 shadow-lg shadow-primary/20" : "")}>
                                        <MediaCard
                                            item={item.media}
                                        // Override click to go to watch/anime page? MediaCard handles it via ID.
                                        />
                                        {isMyList && (
                                            <div className="absolute top-2 right-2 z-20 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                                WATCHING
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full h-40 flex items-center justify-center text-muted-foreground">
                            No episodes airing on this day.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
