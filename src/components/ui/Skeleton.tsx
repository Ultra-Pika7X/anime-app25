import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-[--radius] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]",
                className
            )}
        />
    );
}

export function MediaCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Skeleton className="aspect-[2/3] w-full rounded-[--radius]" />
            <div className="space-y-1.5 px-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

export function MediaRowSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-7 w-40" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: count }).map((_, i) => (
                    <MediaCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

export function EpisodeCardSkeleton() {
    return (
        <div className="flex gap-3">
            <Skeleton className="w-40 h-24 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
            </div>
        </div>
    );
}

export function PlayerSkeleton() {
    return (
        <div className="relative aspect-video w-full">
            <Skeleton className="absolute inset-0 rounded-xl" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
            </div>
        </div>
    );
}
