import { jikan } from "@/lib/jikan";
import { MediaCard } from "@/components/common/MediaCard";
import { MediaItem } from "@/types";

export default async function MoviesPage() {
    let movies: MediaItem[] = [];

    try {
        const data = await jikan.getPopularAnime("movie");
        movies = data.results;
    } catch (error) {
        console.error("Failed to fetch movies", error);
    }

    return (
        <div className="container py-12 min-h-screen">
            <div className="flex flex-col gap-2 mb-10 border-b border-white/5 pb-6">
                <h1 className="text-4xl font-black tracking-tight text-white">
                    Movies
                </h1>
                <p className="text-muted-foreground font-medium">
                    Explore the best and most popular movies.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                {movies.map((item) => (
                    <MediaCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
