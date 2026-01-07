/**
 * HiAnime (formerly Zoro.to / Aniwatch) Provider
 * Provides direct HLS streams without ads
 */

import axios from 'axios';
import { load } from 'cheerio';

export class HiAnime {
    protected baseUrl = 'https://hianime.to';
    protected apiUrl = 'https://hianime.to/ajax';

    async search(query: string) {
        try {
            // Use the search API
            const { data } = await axios.get(`${this.baseUrl}/search?keyword=${encodeURIComponent(query)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            });

            const $ = load(data);
            const results: any[] = [];

            $('.film_list-wrap .flw-item').each((i, el) => {
                const href = $(el).find('.film-poster-ahref').attr('href');
                const id = href?.split('/').pop()?.split('?')[0];
                const title = $(el).find('.film-name a').text().trim();
                const image = $(el).find('.film-poster-img').attr('data-src') || $(el).find('.film-poster-img').attr('src');
                const type = $(el).find('.fdi-type').text().trim();
                const duration = $(el).find('.fdi-duration').text().trim();

                if (id && title) {
                    results.push({
                        id,
                        title,
                        image,
                        type,
                        duration
                    });
                }
            });

            return { results };
        } catch (err: any) {
            console.error("HiAnime Search Error:", err.message);
            return { results: [] };
        }
    }

    async fetchAnimeInfo(id: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/watch/${id}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            });

            const $ = load(data);

            // Get anime ID for episode fetching
            const animeId = $('.watch-anime').attr('data-id');
            const title = $('.film-name').text().trim();

            if (!animeId) {
                throw new Error('Could not find anime ID');
            }

            // Fetch episodes list via AJAX
            const episodesRes = await axios.get(`${this.apiUrl}/v2/episode/list/${animeId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': `${this.baseUrl}/watch/${id}`
                }
            });

            const $ep = load(episodesRes.data.html);
            const episodes: any[] = [];

            $ep('.ssl-item.ep-item').each((i, el) => {
                const href = $(el).attr('href');
                const epId = $(el).attr('data-id');
                const epNum = $(el).attr('data-number');
                const epTitle = $(el).attr('title') || `Episode ${epNum}`;

                if (epId && epNum) {
                    episodes.push({
                        id: epId,
                        number: parseFloat(epNum),
                        title: epTitle
                    });
                }
            });

            return {
                id,
                title,
                animeId,
                episodes
            };
        } catch (err: any) {
            console.error("HiAnime Info Error:", err.message);
            throw new Error("Failed to fetch HiAnime info");
        }
    }

    async fetchEpisodeSources(episodeId: string) {
        try {
            // Get available servers
            const serversRes = await axios.get(`${this.apiUrl}/v2/episode/servers?episodeId=${episodeId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': this.baseUrl
                }
            });

            const $servers = load(serversRes.data.html);
            const sources: any[] = [];

            const servers: { id: string; name: string; type: string }[] = [];

            $servers('.server-item').each((i, el) => {
                const serverId = $servers(el).attr('data-id');
                const serverName = $servers(el).text().trim();
                const serverType = $servers(el).attr('data-type') || 'sub';

                if (serverId) {
                    servers.push({
                        id: serverId,
                        name: serverName,
                        type: serverType
                    });
                }
            });

            // Prioritize servers that typically have direct streams
            const priorityServers = ['HD-1', 'HD-2', 'Vidstreaming', 'Vidcloud', 'MegaCloud', 'RapidCloud'];
            servers.sort((a, b) => {
                const aIdx = priorityServers.findIndex(p => a.name.includes(p));
                const bIdx = priorityServers.findIndex(p => b.name.includes(p));
                return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
            });

            // Helper to fetch from a single server
            const fetchFromServer = async (server: any) => {
                try {
                    const sourceRes = await axios.get(
                        `${this.apiUrl}/v2/episode/sources?id=${server.id}`,
                        {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'X-Requested-With': 'XMLHttpRequest',
                                'Referer': this.baseUrl
                            }
                        }
                    );

                    if (sourceRes.data.link) {
                        const m3u8 = await this.extractM3U8(sourceRes.data.link);
                        if (m3u8) {
                            return {
                                url: m3u8,
                                quality: `${server.name} (${server.type})`,
                                isM3U8: true,
                                server: server.name
                            };
                        }
                    }
                } catch (e) {
                    return null;
                }
                return null;
            };

            // Try the top 4 servers in parallel for max speed
            const topServers = servers.slice(0, 4);
            const results = await Promise.all(topServers.map(fetchFromServer));

            results.forEach(res => {
                if (res) sources.push(res);
            });

            return { sources };
        } catch (err: any) {
            console.error("HiAnime Source Error:", err.message);
            return { sources: [] };
        }
    }

    async extractM3U8(embedUrl: string): Promise<string | null> {
        try {
            const { data } = await axios.get(embedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            });

            // Try to find m3u8 URL in the response (various patterns)
            const m3u8Match = data.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
            if (m3u8Match) {
                return m3u8Match[1];
            }

            // Look for base64 encoded sources (some versions of Zoro)
            const b64Match = data.match(/sources\s*=\s*['"](.*?)['"]/);
            if (b64Match) {
                try {
                    const decoded = Buffer.from(b64Match[1], 'base64').toString('utf-8');
                    if (decoded.includes('.m3u8')) {
                        const m3u8 = decoded.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
                        if (m3u8) return m3u8[1];
                    }
                } catch { }
            }

            // Try to find in JSON data
            const jsonMatch = data.match(/sources\s*[=:]\s*(\[[^\]]+\])/);
            if (jsonMatch) {
                try {
                    const sources = JSON.parse(jsonMatch[1]);
                    const m3u8Source = sources.find((s: any) => s.file?.includes('.m3u8') || s.url?.includes('.m3u8'));
                    if (m3u8Source) {
                        return m3u8Source.file || m3u8Source.url;
                    }
                } catch { }
            }

            return null;
        } catch (e) {
            return null;
        }
    }
}
