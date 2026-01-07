
export interface SkipTime {
    start: number;
    end: number;
}

export interface SkipResponse {
    op?: SkipTime;
    ed?: SkipTime;
}

export const aniskip = {
    async getSkipTimes(malId: number, episodeNumber: number): Promise<SkipResponse> {
        try {
            // AniSkip API: https://api.aniskip.com/v2/skip-times/{malId}/{episodeNumber}?types[]=op&types[]=ed
            const response = await fetch(
                `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?types[]=op&types[]=ed`
            );

            if (!response.ok) return {};

            const data = await response.json();
            if (!data.found) return {};

            const result: SkipResponse = {};

            const op = data.results.find((r: any) => r.skipType === 'op');
            if (op) {
                result.op = { start: op.interval.startTime, end: op.interval.endTime };
            }

            const ed = data.results.find((r: any) => r.skipType === 'ed');
            if (ed) {
                result.ed = { start: ed.interval.startTime, end: ed.interval.endTime };
            }

            return result;
        } catch (e) {
            console.error("AniSkip fetch failed", e);
            return {};
        }
    }
};
