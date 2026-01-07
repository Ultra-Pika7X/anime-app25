/**
 * KickAssAnime (KAA) Provider
 * Provides direct HLS streams
 */

import axios from 'axios';
import { load } from 'cheerio';

export class KickAssAnime {
    protected baseUrl = 'https://kickassanime.am';
    protected apiBase = 'https://kickassanime.am/api/show';

    async search(query: string) {
        try {
            // KAA uses a search API or we can scrape the search page
            const { data } = await axios.get(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            });

            const $ = load(data);
            const results: any[] = [];

            $('.anime-item').each((i, el) => {
                const href = $(el).find('a').attr('href');
                const id = href?.split('/').pop();
                const title = $(el).find('.title').text().trim();
                const image = $(el).find('img').attr('src');

                if (id && title) {
                    results.push({ id, title, image });
                }
            });

            return { results };
        } catch (err: any) {
            console.error("KickAssAnime Search Error:", err.message);
            return { results: [] };
        }
    }

    async fetchAnimeInfo(id: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/detail/${id}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            });

            const $ = load(data);
            const episodes: any[] = [];

            // KAA often lists episodes in a list or grid
            $('.episodes-list .episode-item').each((i, el) => {
                const href = $(el).find('a').attr('href');
                const epNum = $(el).find('.ep-num').text().trim();

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
                title: $('.anime-title').text().trim(),
                episodes: episodes.sort((a, b) => a.number - b.number)
            };
        } catch (err: any) {
            console.error("KickAssAnime Info Error:", err.message);
            throw new Error("Failed to fetch KickAssAnime info");
        }
    }

    async fetchEpisodeSources(episodeId: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/watch/${episodeId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            });

            const $ = load(data);
            const sources: any[] = [];

            // KAA has multiple servers, often using "Pink" or "Dood"
            // We look for direct HLS links in scripts
            const scriptContent = $('script').map((i, el) => $(el).html()).get().join('\n');

            // Try to find m3u8 patterns
            const m3u8Matches = scriptContent.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/g);
            if (m3u8Matches) {
                m3u8Matches.forEach((url: string, i: number) => {
                    if (!sources.find(s => s.url === url)) {
                        sources.push({
                            url,
                            quality: `KAA Server ${i + 1}`,
                            isM3U8: true
                        });
                    }
                });
            }

            return { sources };
        } catch (err: any) {
            console.error("KickAssAnime Source Error:", err.message);
            return { sources: [] };
        }
    }
}
