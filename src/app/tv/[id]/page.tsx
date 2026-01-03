import { tmdb } from "@/lib/tmdb";
import { Button } from "@/components/ui/Button";
import { Play, Star, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MediaRow } from "@/components/common/MediaRow";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TvPage({ params }: PageProps) {
    const { id } = await params;
    const show = await tmdb.getDetails("tv", id);
    const recommendations = show.recommendations?.results || [];

    const backdropUrl = show.backdrop_path
        ? (show.backdrop_path.startsWith("http") ? show.backdrop_path : `https://image.tmdb.org/t/p/original${show.backdrop_path}`)
        : null;

    const posterUrl = show.poster_path
        ? (show.poster_path.startsWith("http") ? show.poster_path : `https://image.tmdb.org/t/p/w500${show.poster_path}`)
        : null;

    return (
        <div className="min-h-screen pb-20">
            {/* Hero / Backdrop */}
            <div className="relative h-[65vh] w-full overflow-hidden">
                {backdropUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${backdropUrl})` }}
                    >
                        {/* Premium Gradients */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,transparent,rgba(0,0,0,0.4))]" />
                    </div>
                )}

                <div className="container relative z-10 flex h-full flex-col justify-end pb-10">
                    <div className="flex flex-col gap-8 md:flex-row md:items-end">
                        {/* Poster with Glassmorphism Effect */}
                        <div className="hidden md:block relative h-[420px] w-[280px] overflow-hidden rounded-[--radius] shadow-2xl shrink-0 border border-white/10 group">
                            {posterUrl ? (
                                <Image
                                    src={posterUrl}
                                    alt={show.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : <div className="h-full w-full bg-muted" />}
                        </div>

                        <div className="flex flex-col gap-6 max-w-4xl pb-4">
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black tracking-tighter md:text-7xl text-white drop-shadow-2xl">
                                    {show.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                                    <div className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span>{show.vote_average?.toFixed(1)}</span>
                                    </div>
                                    <span className="text-white/40">•</span>
                                    <div className="flex items-center gap-2 text-white/80">
                                        <Calendar className="h-4 w-4" />
                                        <span>{show.first_air_date?.split("-")[0]}</span>
                                    </div>
                                    <span className="text-white/40">•</span>
                                    <div className="text-white/80">
                                        {show.number_of_seasons} Seasons • {show.number_of_episodes} Episodes
                                    </div>
                                    <span className="text-white/40">•</span>
                                    <span className="bg-white/10 text-white/90 border border-white/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest text-[#6152df]">TV Series</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {show.genres?.map((g: { id: number; name: string }) => (
                                    <span key={g.id} className="rounded-full border border-white/5 bg-white/5 backdrop-blur-md px-4 py-1 text-xs font-semibold text-white/80">
                                        {g.name}
                                    </span>
                                ))}
                            </div>

                            <p className="text-lg text-white/70 font-medium leading-relaxed max-w-3xl line-clamp-4 md:line-clamp-none">
                                {show.overview}
                            </p>

                            <div className="flex flex-wrap gap-4 mt-2">
                                {/* Default to S1E1 for now */}
                                <Link href={`/watch/${id}/1`}>
                                    <Button size="lg" className="h-14 px-10 gap-3 text-lg font-bold rounded-full shadow-[0_0_20px_rgba(97,82,223,0.4)] hover:shadow-[0_0_30px_rgba(97,82,223,0.6)] transition-all">
                                        <Play className="h-6 w-6 fill-current" /> Play S1 E1
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="h-14 px-10 gap-3 text-lg font-bold rounded-full border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all text-white">
                                    + Add to List
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Season & Episode Selector Placeholder - Visual matching Seanime */}
            <div className="container mt-12">
                <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-bold text-white">Episodes</h2>
                    <div className="ml-auto flex gap-2">
                        <select className="bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm font-medium focus:ring-1 focus:ring-primary/50 outline-none text-white/80">
                            {Array.from({ length: show.number_of_seasons }, (_, i) => (
                                <option key={i + 1} value={i + 1} className="bg-background">Season {i + 1}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Placeholder episodes for visual effect */}
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="group relative flex gap-4 p-3 rounded-[--radius] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer">
                            <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-white/5">
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="h-6 w-6 fill-white" />
                                </div>
                            </div>
                            <div className="flex flex-col justify-center gap-1">
                                <span className="text-xs font-bold text-primary uppercase tracking-tighter">Episode {i + 1}</span>
                                <span className="text-sm font-semibold text-white/90 line-clamp-1">Episode Title Placeholder</span>
                                <span className="text-[10px] text-white/40">24 min • Jan 12, 2024</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            <div className="container mt-10">
                <MediaRow title="You May Also Like" items={recommendations} type="tv" />
            </div>
        </div>
    );
}
