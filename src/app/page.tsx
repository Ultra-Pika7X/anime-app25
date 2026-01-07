import { MediaRow } from "@/components/common/MediaRow";
import { ContinueWatchingRow } from "@/components/common/ContinueWatchingRow";
import { CurrentlyWatchingRow } from "@/components/home/CurrentlyWatchingRow";
import { anilist } from "@/lib/anilist";
import { Button } from "@/components/ui/Button";
import { Play, Info } from "lucide-react";
import Link from "next/link";
import { AnilistLogin } from "@/components/auth/AnilistLogin";

export default async function Home() {
  let trending: any = { data: { Page: { media: [] } } };
  let popular: any = { data: { Page: { media: [] } } };
  let recent: any = { data: { Page: { media: [] } } };

  try {
    [trending, popular, recent] = await Promise.all([
      anilist.getTrending(),
      anilist.getPopular(),
      anilist.getRecentEpisodes(),
    ]);
  } catch (error) {
    console.error("Failed to fetch AniList data:", error);
  }

  const trendingAnimes = trending?.data?.Page?.media || [];
  const popularAnimes = popular?.data?.Page?.media || [];
  const recentAnimes = recent?.data?.Page?.media || [];
  const featured = trendingAnimes[0];

  return (
    <div className="relative min-h-screen pb-20" suppressHydrationWarning>
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          {featured ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
              style={{ backgroundImage: `url(${featured.bannerImage || featured.coverImage?.extraLarge})` }}
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

        <div className="container relative z-30 flex h-full flex-col justify-center pt-20 pb-12">
          <div className="max-w-3xl space-y-5">
            {featured && (
              <>
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                  <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                    Featured
                  </span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{featured.seasonYear}</span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">•</span>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{featured.format}</span>
                </div>

                <h1 className="text-4xl font-black tracking-tighter md:text-5xl lg:text-6xl text-white drop-shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  {featured.title?.english || featured.title?.romaji || "Welcome to CloudAnime"}
                </h1>

                <div
                  className="line-clamp-3 text-base text-white/70 md:text-lg font-medium max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
                  dangerouslySetInnerHTML={{ __html: featured.description || "Discover the best anime." }}
                />

                <div className="flex flex-wrap gap-3 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                  <Link href={`/watch/${featured.id}/1`}>
                    <Button size="lg" className="h-12 px-6 gap-2 text-base font-bold rounded-full shadow-[0_0_20px_rgba(97,82,223,0.4)] hover:shadow-[0_0_30px_rgba(97,82,223,0.6)] transition-all">
                      <Play className="h-5 w-5 fill-current" /> Watch Now
                    </Button>
                  </Link>
                  <Link href={`/watch/${featured.id}`}>
                    <Button size="lg" variant="outline" className="h-12 px-6 gap-2 text-base font-bold rounded-full border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
                      <Info className="h-5 w-5" /> Details
                    </Button>
                  </Link>
                </div>
              </>
            )}
            {!featured && (
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-bold">Welcome to Anime App</h1>
                <AnilistLogin />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="relative z-20 -mt-10 space-y-10 pl-4 md:pl-0">
        <ContinueWatchingRow />
        <CurrentlyWatchingRow />
        <MediaRow title="Trending Now" items={trendingAnimes} type="tv" />
        <MediaRow title="Recently Updated" items={recentAnimes} type="tv" />
        <MediaRow title="Popular All Time" items={popularAnimes} type="tv" />
      </div>
    </div>
  );
}
