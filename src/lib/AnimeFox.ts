/**
 * AnimeFox Provider - Alternative source
 * Provides direct HLS streams
 */

import axios from 'axios';
import { load } from 'cheerio';

export class AnimeFox {
    protected baseUrl = 'https://animefox.tv';

    async search(query: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/search?keyword=${encodeURIComponent(query)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = load(data);
            const results: any[] = [];

            $('.film_list-wrap .flw-item').each((i, el) => {
                const href = $(el).find('.film-poster-ahref').attr('href');
                const id = href?.split('/').pop();
                const title = $(el).find('.film-name a').text().trim();
                const image = $(el).find('.film-poster-img').attr('data-src');

                if (id && title) {
                    results.push({ id, title, image });
                }
            });

            return { results };
        } catch (err: any) {
            console.error("AnimeFox Search Error:", err.message);
            return { results: [] };
        }
    }

    async fetchAnimeInfo(id: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/anime/${id}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = load(data);
            const episodes: any[] = [];

            $('.ss-list a').each((i, el) => {
                const href = $(el).attr('href');
                const epNum = $(el).attr('data-number') || $(el).text().trim();

                if (href) {
                    episodes.push({
                        id: href.split('/').pop() || '',
                        number: parseFloat(epNum) || i + 1,
                        title: `Episode ${epNum}`
                    });
                }
            });

            return {
                id,
                title: $('.film-name').text().trim(),
                episodes
            };
        } catch (err: any) {
            console.error("AnimeFox Info Error:", err.message);
            throw new Error("Failed to fetch AnimeFox info");
        }
    }

    async fetchEpisodeSources(episodeId: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/watch/${episodeId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const $ = load(data);
            const sources: any[] = [];

            // Look for m3u8 sources in page
            const scriptContent = $('script:contains("m3u8")').html() || data;
            const m3u8Match = scriptContent.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/g);

            if (m3u8Match) {
                m3u8Match.forEach((url: string, i: number) => {
                    sources.push({
                        url,
                        quality: `Source ${i + 1}`,
                        isM3U8: true
                    });
                });
            }

            return { sources };
        } catch (err: any) {
            console.error("AnimeFox Source Error:", err.message);
            return { sources: [] };
        }
    }
}
