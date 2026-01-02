import { tmdb } from "@/lib/tmdb";
import { Button } from "@/components/ui/Button";
import { Play, Star, Calendar, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MediaRow } from "@/components/common/MediaRow";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MoviePage({ params }: PageProps) {
    const { id } = await params;
    const movie = await tmdb.getDetails("movie", id);
    const recommendations = movie.recommendations?.results || [];

    const backdropUrl = movie.backdrop_path
        ? (movie.backdrop_path.startsWith("http") ? movie.backdrop_path : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`)
        : null;

    const posterUrl = movie.poster_path
        ? (movie.poster_path.startsWith("http") ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
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
                                    alt={movie.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : <div className="h-full w-full bg-muted" />}
                        </div>

                        <div className="flex flex-col gap-6 max-w-4xl pb-4">
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black tracking-tighter md:text-7xl text-white drop-shadow-2xl">
                                    {movie.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                                    <div className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md">
                                        <Star className="h-4 w-4 fill-current" />
                                        <span>{movie.vote_average?.toFixed(1)}</span>
                                    </div>
                                    <span className="text-white/40">•</span>
                                    <div className="flex items-center gap-1 text-white/80">
                                        <Calendar className="h-4 w-4" />
                                        <span>{movie.release_date?.split("-")[0]}</span>
                                    </div>
                                    <span className="text-white/40">•</span>
                                    {movie.runtime && (
                                        <div className="flex items-center gap-1 text-white/80">
                                            <Clock className="h-4 w-4" />
                                            <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                                        </div>
                                    )}
                                    <span className="text-white/40">•</span>
                                    <span className="bg-white/10 text-white/90 border border-white/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest">Movie</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {movie.genres?.map((g: { id: number; name: string }) => (
                                    <span key={g.id} className="rounded-full border border-white/5 bg-white/5 backdrop-blur-md px-4 py-1 text-xs font-semibold text-white/80">
                                        {g.name}
                                    </span>
                                ))}
                            </div>

                            <p className="text-lg text-white/70 font-medium leading-relaxed max-w-3xl line-clamp-4 md:line-clamp-none">
                                {movie.overview}
                            </p>

                            <div className="flex flex-wrap gap-4 mt-2">
                                <Link href={`https://vidsrc.xyz/embed/movie/${id}`} target="_blank">
                                    <Button size="lg" className="h-14 px-10 gap-3 text-lg font-bold rounded-full shadow-[0_0_20px_rgba(97,82,223,0.4)] hover:shadow-[0_0_30px_rgba(97,82,223,0.6)] transition-all">
                                        <Play className="h-6 w-6 fill-current" /> Play Now
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

            {/* Recommendations */}
            <div className="container mt-10">
                <MediaRow title="You May Also Like" items={recommendations} type="movie" />
            </div>
        </div>
    );
}
