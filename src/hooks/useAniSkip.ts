"use client";

import { useQuery } from "@tanstack/react-query";

export const SKIP_TYPES = ["op", "ed", "mixed-op", "mixed-ed", "recap"] as const;
export type SkipType = (typeof SKIP_TYPES)[number];

export interface SkipTime {
    interval: {
        startTime: number;
        endTime: number;
    };
    skipType: SkipType;
    skipId: string;
    episodeLength: number;
}

export interface AniSkipData {
    op: SkipTime | null;
    ed: SkipTime | null;
}

/**
 * Fetches intro/outro skip times from the AniSkip API.
 * @param malId - MyAnimeList ID of the anime
 * @param episodeNumber - Current episode number
 * @returns Skip data for opening and ending
 */
export function useAniSkip(malId: number | string | null | undefined, episodeNumber: number | string | null | undefined) {
    const numMalId = malId ? Number(malId) : null;
    const numEpisode = episodeNumber ? Number(episodeNumber) : null;

    return useQuery<AniSkipData>({
        queryKey: ["aniskip", numMalId, numEpisode],
        queryFn: async () => {
            if (!numMalId || !numEpisode || numEpisode < 1) {
                return { op: null, ed: null };
            }

            try {
                const response = await fetch(
                    `https://api.aniskip.com/v2/skip-times/${numMalId}/${numEpisode}?types[]=op&types[]=ed&types[]=mixed-op&types[]=mixed-ed&types[]=recap&episodeLength=`
                );

                if (!response.ok) {
                    console.warn("[AniSkip] API returned error:", response.status);
                    return { op: null, ed: null };
                }

                const data = await response.json();

                if (!data.found || !data.results) {
                    return { op: null, ed: null };
                }

                const op = data.results.find((r: SkipTime) => r.skipType === "op" || r.skipType === "mixed-op") || null;
                const ed = data.results.find((r: SkipTime) => r.skipType === "ed" || r.skipType === "mixed-ed") || null;

                return { op, ed };
            } catch (error) {
                console.error("[AniSkip] Failed to fetch skip data:", error);
                return { op: null, ed: null };
            }
        },
        enabled: !!numMalId && !!numEpisode && numEpisode >= 1,
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false,
    });
}
