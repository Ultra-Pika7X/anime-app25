import { MediaRow } from "@/components/common/MediaRow";
import { ContinueWatchingRow } from "@/components/common/ContinueWatchingRow";
import { tmdb } from "@/lib/tmdb";
import { Button } from "@/components/ui/Button";
import { Play, Info } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  let trendingMovies: any = { results: [] };
  let trendingTv: any = { results: [] };
  let topRatedMovies: any = { results: [] };
  let popularMovies: any = { results: [] };

  try {
    [
      trendingMovies,
      trendingTv,
      topRatedMovies,
      popularMovies,
    ] = await Promise.all([
      tmdb.getTrending("movie"),
      tmdb.getTrending("tv"),
      tmdb.getTopRated("movie"),
      tmdb.getPopular("movie"),
    ]);
  } catch (error) {
    console.error("Failed to fetch TMDB data:", error);
    // Continue with empty data to avoid crashing the whole page if API key is missing
  }

  const featured = trendingMovies.results[0];

  return (
    <div className="relative min-h-screen pb-20" suppressHydrationWarning>
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          {featured ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
              style={{ backgroundImage: `url(${featured.backdrop_path?.startsWith("http") ? featured.backdrop_path : `https://image.tmdb.org/t/p/original${featured.backdrop_path}`})` }}
            >
              {/* Complex Gradients for Premium Look */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,transparent,rgba(0,0,0,0.5))]" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
        </div>

        <div className="container relative z-30 flex h-full flex-col justify-end pb-24">
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-2">
              <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                Featured
              </span>
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{featured?.release_date?.split('-')[0]}</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter md:text-7xl lg:text-8xl text-white drop-shadow-2xl">
              {featured?.title || featured?.name || "Welcome to CloudAnime"}
            </h1>
            <p className="line-clamp-3 text-lg text-white/70 md:text-xl font-medium max-w-xl leading-relaxed">
              {featured?.overview || "Discover the best movies and TV shows completely free."}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href={`https://vidsrc.xyz/embed/${featured?.media_type || 'movie'}/${featured?.id}`} target="_blank">
                <Button size="lg" className="h-14 px-8 gap-3 text-lg font-bold rounded-full shadow-[0_0_20px_rgba(97,82,223,0.4)] hover:shadow-[0_0_30px_rgba(97,82,223,0.6)] transition-all">
                  <Play className="h-6 w-6 fill-current" /> Watch Now
                </Button>
              </Link>
              <Link href={`/${featured?.media_type || 'movie'}/${featured?.id}`}>
                <Button size="lg" variant="outline" className="h-14 px-8 gap-3 text-lg font-bold rounded-full border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
                  <Info className="h-6 w-6" /> Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="relative z-20 -mt-32 space-y-8 pl-4 md:pl-0">
        <ContinueWatchingRow />
        <MediaRow title="Trending Anime Movies" items={trendingMovies.results} type="movie" />
        <MediaRow title="Trending Anime Series" items={trendingTv.results} type="tv" />
        <MediaRow title="Top Rated Anime Movies" items={topRatedMovies.results} type="movie" />
        <MediaRow title="Popular Anime Movies" items={popularMovies.results} type="movie" />
      </div>
    </div>
  );
}
