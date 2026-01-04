import { jikan } from "@/lib/jikan";
import { MediaCard } from "@/components/common/MediaCard";
import { MediaItem } from "@/types";

export default async function TrendingPage() {
    let TrendingMovies: MediaItem[] = [];
    let TrendingTV: MediaItem[] = [];

    try {
        const movieData = await jikan.getTrendingAnime("movie");
        const tvData = await jikan.getTrendingAnime("tv");
        TrendingMovies = movieData.results;
        TrendingTV = tvData.results;
    } catch (error) {
        console.error("Failed to fetch trending data", error);
    }

    const allTrending = [...TrendingMovies, ...TrendingTV].sort(() => Math.random() - 0.5);

    return (
        <div className="container py-12 min-h-screen">
            <div className="flex flex-col gap-2 mb-10 border-b border-white/5 pb-6">
                <h1 className="text-4xl font-black tracking-tight text-white">
                    Trending Now
                </h1>
                <p className="text-muted-foreground font-medium">
                    The most popular movies and TV shows right now.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                {allTrending.map((item) => (
                    <MediaCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
