
import { load } from 'cheerio';
import axios from 'axios';

export class AnimePahe {
    protected baseUrl = 'https://animepahe.ru';

    // Custom search implementation
    async search(query: string) {
        try {
            const { data } = await axios.get(`${this.baseUrl}/api?m=search&q=${encodeURIComponent(query)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': this.baseUrl,
                    'Cookie': 'dummy_cookie=1' // sometimes helps
                }
            });
            // API returns { data: [ { id: 123, title: "..." } ] }
            if (!data.data) return { results: [] };

            return {
                results: data.data.map((item: any) => ({
                    id: String(item.id),
                    title: item.title,
                    image: item.poster,
                    url: `${this.baseUrl}/anime/${item.session}`, // session is the slug
                    releaseDate: item.year
                }))
            };
        } catch (err: any) {
            console.error("AnimePahe Search Error:", err.message);
            throw err; // Propagate error to route
        }
    }

    async fetchAnimeInfo(id: string) { // id here is the numeric ID from search
        // We need the "session" (slug) to get episodes page, but usually we just need ID to hit the API
        // AnimePahe API for episodes: /api?m=release&id={id}&sort=episode_asc&page=1

        let episodes: any[] = [];
        let page = 1;
        let lastPage = 1;

        try {
            do {
                const { data } = await axios.get(`${this.baseUrl}/api?m=release&id=${id}&sort=episode_asc&page=${page}`);
                lastPage = data.last_page;

                data.data.forEach((item: any) => {
                    episodes.push({
                        id: item.session, // This is the episode source ID
                        number: item.episode,
                        title: `Episode ${item.episode}`,
                        image: item.snapshot
                    });
                });
                page++;
            } while (page <= lastPage);

            return {
                id: id,
                title: "", // We might not get title easily here without scraping the page, but that's fine
                episodes: episodes
            };
        } catch (err) {
            throw new Error(`Failed to fetch anime info: ${err}`);
        }
    }

    async fetchEpisodeSources(episodeId: string) {
        // episodeId is the "session" for the episode
        // URL: https://animepahe.ru/play/{main_session}/{episode_session}
        // But wait, the API returns episode session. We construct play page url.
        // Actually, we can just hit /api?m=embed&p=kwik&id={episode_session} NOT session? 
        // Let's look at how successful scrapers do it.
        // Usually: GET https://animepahe.ru/api?m=links&id={episodeId}&p=kwik
        // Then extract Kwiktwo link.

        try {
            const { data } = await axios.get(`${this.baseUrl}/api?m=links&id=${episodeId}&p=kwik`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': this.baseUrl
                }
            });

            // data.data is array of objects { 1080: { kwik: "url", audio: "jpn" }, ... }
            const links = data.data;
            const sources: any[] = [];

            for (const linkObj of links) {
                // linkObj keys are resolutions? No, it's array of Maps?
                for (const [res, content] of Object.entries(linkObj)) {
                    // content is { kwik: "https://kwik.cx/...", dub: 0, ... }
                    const kwikUrl = (content as any).kwik;
                    // Need to extract m3u8 from kwik
                    const m3u8 = await this.extractKwik(kwikUrl);
                    if (m3u8) {
                        sources.push({
                            url: m3u8,
                            quality: `${res}p`,
                            isM3U8: true
                        });
                    }
                }
            }

            return { sources };
        } catch (err) {
            throw new Error(`Failed to fetch sources: ${err}`);
        }
    }

    async extractKwik(url: string) {
        try {
            const { data } = await axios.get(url, {
                headers: { 'Referer': 'https://animepahe.ru/' }
            });

            // Regex for common Kwik source patterns
            // 1. Check for straight m3u8 in script
            const directMatch = data.match(/(https:\/\/.*\.m3u8)/);
            if (directMatch) return directMatch[0];

            // 2. Kwik often uses packed JS: eval(function(p,a,c,k,e,d)...
            // We can often find the source even without full unpacking by looking at the strings
            if (data.includes('eval(function(p,a,c,k,e,d)')) {
                const sourceMatch = data.match(/source\s*=\s*(['"])(https?:\/\/.*?\.m3u8.*?)\1/);
                if (sourceMatch) return sourceMatch[2];

                // Try another pattern commonly found in packed kwik
                const m3u8Match = data.match(/https?:\/\/[^'"]+\.m3u8[^'"]*/);
                if (m3u8Match) return m3u8Match[0];
            }

            return null;
        } catch (e) {
            console.error("Kwik Extraction Failed:", e);
            return null;
        }
    }
}
