"use client";

import { MediaRow } from "@/components/common/MediaRow";
import { useLibrary } from "@/context/LibraryContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Clock, PlayCircle, BarChart3, TrendingUp } from "lucide-react";

export default function LibraryPage() {
    const { watchlist, history, mediaList } = useLibrary();
    const { user } = useAuth();

    // Calculate Stats
    // Filter out "PLANNING" for stats usually, as they haven't been watched?
    // Actually, Anilist includes everything in lists.
    // "Episodes Watched" = sum of 'progress'
    // "Time Watched" = sum of 'progress' * 'media.duration'
    // "Mean Score" = average of 'score' where score > 0

    // We should use `mediaList` from AniList for accurate global stats (synced).
    // Local `history` is for "Continue Watching" quick access.

    let totalEpisodes = 0;
    let totalMinutes = 0;
    let totalScore = 0;
    let scoredCount = 0;
    const genreCounts: Record<string, number> = {};

    mediaList.forEach((entry: any) => {
        const progress = entry.progress || 0;
        const duration = entry.media.duration || 24; // fallback 24m
        const score = entry.score || 0;

        totalEpisodes += progress;
        totalMinutes += progress * duration;

        if (score > 0) {
            totalScore += score;
            scoredCount++;
        }

        // Count genres for entries with at least 1 episode watched (or Completed/Dropped/Watching)
        // Avoid counting genres from "Planning" if progress is 0?
        // Usually stats count everything you've interacted with. 
        // AniList creates stats based on status != PLANNING usually.
        if (entry.status !== "PLANNING" && entry.media.genres) {
            entry.media.genres.forEach((g: string) => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
        }
    });

    const totalDays = (totalMinutes / 60 / 24).toFixed(1);
    const meanScore = scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : "0.0";

    // Sort genres
    const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return (
        <div className="min-h-screen pt-24 pb-10 px-4 md:px-8 space-y-8 animate-in fade-in duration-500">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Library</h1>
                <p className="text-gray-400">Welcome back, <span className="text-primary font-semibold">{user?.name || "Guest"}</span>.</p>
            </header>

            {/* Stats Overview */}
            {user && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-secondary/10 border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                            <PlayCircle className="w-4 h-4 text-primary" /> Episodes Watched
                        </div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            {totalEpisodes.toLocaleString()}
                        </div>
                    </div>

                    <div className="bg-secondary/10 border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                            <Clock className="w-4 h-4 text-blue-400" /> Days Watched
                        </div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            {totalDays} <span className="text-sm font-normal text-muted-foreground">Days</span>
                        </div>
                    </div>

                    <div className="bg-secondary/10 border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                            <BarChart3 className="w-4 h-4 text-green-400" /> Mean Score
                        </div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            {meanScore}
                        </div>
                    </div>

                    <div className="bg-secondary/10 border border-white/5 rounded-2xl p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                            <TrendingUp className="w-4 h-4 text-purple-400" /> Top Genres
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {topGenres.length > 0 ? topGenres.map(([genre]) => (
                                <span key={genre} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/80">
                                    {genre}
                                </span>
                            )) : <span className="text-sm text-muted-foreground">-</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Watchlist Section */}
            {watchlist.length > 0 ? (
                <MediaRow
                    title="Watchlist"
                    items={watchlist.map((item: any) => ({
                        ...item,
                        id: Number(item.id)
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
                    items={history.map((item: any) => ({
                        ...item,
                        id: Number(item.id)
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
