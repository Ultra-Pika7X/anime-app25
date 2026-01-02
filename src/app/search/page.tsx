import { tmdb } from "@/lib/tmdb";
import { MediaCard } from "@/components/common/MediaCard";
import { MediaItem } from "@/types";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const query = q || "";

    let results: MediaItem[] = [];

    if (query) {
        try {
            const data = await tmdb.search(query);
            results = data.results || [];
        } catch (error) {
            console.error("Search failed", error);
        }
    }

    return (
        <div className="container py-12 min-h-screen">
            <div className="flex flex-col gap-2 mb-10 border-b border-white/5 pb-6">
                <h1 className="text-4xl font-black tracking-tight text-white">
                    Search Results
                </h1>
                <p className="text-muted-foreground font-medium">
                    Showing results for <span className="text-primary italic">&quot;{query}&quot;</span>
                </p>
            </div>

            {results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                    {results
                        .filter((item: MediaItem) => item.poster_path && (item.media_type === "movie" || item.media_type === "tv" || !item.media_type))
                        .map((item: MediaItem) => (
                            <MediaCard key={item.id} item={item} />
                        ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
                    <div className="bg-white/5 p-4 rounded-full mb-4">
                        <span className="text-4xl text-muted-foreground">🔍</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">No results found</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                        We couldn&apos;t find anything for &quot;{query}&quot;. Try adjusting your search.
                    </p>
                </div>
            )}
        </div>
    );
}
