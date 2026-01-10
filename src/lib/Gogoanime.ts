
import axios from 'axios';
import { load } from 'cheerio';

export class Gogoanime {
    protected baseUrl = 'https://anitaku.to'; // Current working domain
    protected backupDomains = ['https://anitaku.bz', 'https://gogoanime3.co']; // TODO: Implement fallback logic
    protected ajaxUrl = 'https://ajax.gogocdn.net/ajax';

    async search(query: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/search.html?keyword=${encodeURIComponent(query)}`);
            const $ = load(data);
            const results: any[] = [];

            $('.last_episodes li').each((i, el) => {
                const id = $(el).find('a').attr('href')?.replace('/category/', '');
                const title = $(el).find('.name a').text().trim();
                const image = $(el).find('img').attr('src');
                const releaseDate = $(el).find('.released').text().trim().replace('Released:', '').trim();

                if (id && title) {
                    results.push({
                        id: id, // anime-slug
                        title: title,
                        image: image,
                        releaseDate: releaseDate
                    });
                }
            });

            return { results };
        } catch (err: any) {
            console.error("Gogoanime Search Error:", err.message);
            return { results: [] };
        }
    }

    async fetchAnimeInfo(id: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/category/${id}`);
            const $ = load(data);

            const title = $('.anime_info_body_bg h1').text().trim();
            const image = $('.anime_info_body_bg img').attr('src');
            const description = $('.description').text().replace('Plot Summary: ', '').trim();

            // Get episode count ID (movie_id)
            const movieId = $('#movie_id').attr('value');
            const alias = $('#alias_anime').attr('value');
            const epStart = $('#episode_page a.active').attr('ep_start');
            const epEnd = $('#episode_page a.active').attr('ep_end') || '0'; // sometimes needs logic

            // Fetch episodes list
            if (movieId) {
                const episodesRes = await axios.get(`${this.ajaxUrl}/load-list-episode?ep_start=0&ep_end=2000&id=${movieId}&default_ep=${0}&alias=${alias}`);
                const $ep = load(episodesRes.data);
                const episodes: any[] = [];

                $ep('li').each((i, el) => {
                    const href = $(el).find('a').attr('href')?.trim(); // /name-episode-1
                    const name = $(el).find('.name').text().trim(); // EP 1
                    // const epNum = name.replace('EP ', '');

                    if (href) {
                        episodes.push({
                            id: href.replace('/', ''), // episode-slug
                            number: parseFloat(name.replace('EP ', '')),
                            title: name,
                        });
                    }
                });

                return {
                    id,
                    title,
                    image,
                    description,
                    episodes: episodes.reverse() // Gogo returns descending usually
                };
            }

            return null;
        } catch (err: any) {
            console.error("Gogoanime Info Error:", err.message);
            throw new Error("Failed to fetch Gogoanime info");
        }
    }

    async fetchEpisodeSources(episodeId: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/${episodeId}`);
            const $ = load(data);

            const sources: any[] = [];
            const serverPromises: Promise<any>[] = [];

            $('.anime_muti_link ul li a').each((i, el) => {
                const serverName = $(el).text().replace('Choose this server', '').trim();
                let videoUrl = $(el).attr('data-video');

                if (videoUrl) {
                    if (!videoUrl.startsWith('http')) videoUrl = `https:${videoUrl}`;

                    // Prioritize servers that often have direct m3u8
                    if (serverName.includes('Vidstreaming') || serverName.includes('Gogo server') || serverName.includes('StreamWish')) {
                        serverPromises.push(this.extractDirectStream(videoUrl, serverName));
                    }
                }
            });

            const results = await Promise.all(serverPromises);
            results.forEach(res => {
                if (res) sources.push(res);
            });

            return { sources };
        } catch (err: any) {
            console.error("Gogoanime Source Error:", err.message);
            return { sources: [] };
        }
    }

    private async extractDirectStream(url: string, name: string) {
        try {
            const { data } = await axios.get(url, {
                headers: { 'Referer': this.baseUrl }
            });

            // 1. Try to find sources: [...] JSON block (JWPlayer style)
            const sourcesMatch = data.match(/sources:\s*(\[[^\]]+\])/);
            if (sourcesMatch && sourcesMatch[1]) {
                const sourcesStr = sourcesMatch[1];
                // Simple parser to extract file: '...' and label: '...'
                // JSON.parse might fail if keys aren't quoted, so use regex
                const fileMatches = [...sourcesStr.matchAll(/file:\s*['"]([^'"]+)['"]/g)];

                if (fileMatches.length > 0) {
                    // Return the first valid m3u8 found, or mapping all of them?
                    // The scraper expects a single promise to return one source object, or we need to refactor to return array.
                    // The current fetchEpisodeSources expects a list of promises where each returns ONE source object (or null).
                    // But actually scraper.ts handles list of lists? No, fetchEpisodeSources returns { sources: [...] }.
                    // But wait, fetchEpisodeSources does: 
                    // results.forEach(res => { if (res) sources.push(res); });
                    // So extractDirectStream returns a SINGLE object.

                    // We will return the best quality one (usually the first or look for 'hls')
                    const m3u8 = fileMatches.find(m => m[1].includes('.m3u8'));
                    if (m3u8) {
                        return {
                            url: m3u8[1],
                            quality: `${name} (HLS)`,
                            isM3U8: true
                        };
                    }
                }
            }

            // 2. Fallback: Look for any m3u8 link in scripts
            const m3u8Match = data.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
            if (m3u8Match) {
                // Ignore some obvious ad-related or invalid m3u8 if they appear
                const url = m3u8Match[0];
                if (!url.includes('google') && !url.includes('analytics')) {
                    return {
                        url: url,
                        quality: `${name} (HLS Fallback)`,
                        isM3U8: true
                    };
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    }
}
