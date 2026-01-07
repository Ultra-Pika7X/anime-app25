/**
 * AllAnime Provider
 * Uses GraphQL API for fetching anime data and streams
 */

import axios from 'axios';

export class AllAnime {
    protected apiUrl = 'https://api.allanime.day/api';
    protected baseUrl = 'https://allanime.to';

    async search(query: string) {
        try {
            const gqlQuery = `
                query($search: SearchInput!, $limit: Int, $page: Int) {
                    shows(search: $search, limit: $limit, page: $page) {
                        edges {
                            _id
                            name
                            englishName
                            thumbnail
                            type
                            episodeCount
                        }
                    }
                }
            `;

            const { data } = await axios.post(this.apiUrl, {
                query: gqlQuery,
                variables: {
                    search: {
                        query: query,
                        allowAdult: false
                    },
                    limit: 20,
                    page: 1
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            });

            const results = data.data?.shows?.edges?.map((show: any) => ({
                id: show._id,
                title: show.englishName || show.name,
                image: show.thumbnail,
                type: show.type,
                episodes: show.episodeCount
            })) || [];

            return { results };
        } catch (err: any) {
            console.error("AllAnime Search Error:", err.message);
            return { results: [] };
        }
    }

    async fetchAnimeInfo(id: string) {
        try {
            const gqlQuery = `
                query($showId: String!) {
                    show(_id: $showId) {
                        _id
                        name
                        englishName
                        thumbnail
                        description
                        episodeCount
                        availableEpisodesDetail
                    }
                }
            `;

            const { data } = await axios.post(this.apiUrl, {
                query: gqlQuery,
                variables: { showId: id }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': this.baseUrl
                }
            });

            const show = data.data?.show;
            if (!show) throw new Error('Show not found');

            // Parse available episodes
            const subEpisodes = show.availableEpisodesDetail?.sub || [];
            const dubEpisodes = show.availableEpisodesDetail?.dub || [];

            // Combine and dedupe
            const allEps = [...new Set([...subEpisodes, ...dubEpisodes])];

            const episodes = allEps.map((epNum: string) => ({
                id: `${id}:${epNum}`,
                number: parseFloat(epNum),
                title: `Episode ${epNum}`,
                hasSub: subEpisodes.includes(epNum),
                hasDub: dubEpisodes.includes(epNum)
            })).sort((a, b) => a.number - b.number);

            return {
                id,
                title: show.englishName || show.name,
                image: show.thumbnail,
                description: show.description,
                episodes
            };
        } catch (err: any) {
            console.error("AllAnime Info Error:", err.message);
            throw new Error("Failed to fetch AllAnime info");
        }
    }

    async fetchEpisodeSources(episodeId: string) {
        try {
            const [showId, episode] = episodeId.split(':');

            const gqlQuery = `
                query($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) {
                    episode(showId: $showId, translationType: $translationType, episodeString: $episodeString) {
                        sourceUrls
                    }
                }
            `;

            // Try sub first, then dub
            const sources: any[] = [];

            for (const translationType of ['sub', 'dub']) {
                try {
                    const { data } = await axios.post(this.apiUrl, {
                        query: gqlQuery,
                        variables: {
                            showId,
                            translationType,
                            episodeString: episode
                        }
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Referer': this.baseUrl
                        }
                    });

                    const sourceUrls = data.data?.episode?.sourceUrls || [];

                    for (const source of sourceUrls) {
                        // Decode the source URL (AllAnime encodes them)
                        const decodedUrl = this.decodeUrl(source.sourceUrl);

                        if (decodedUrl && (decodedUrl.includes('.m3u8') || decodedUrl.includes('.mp4'))) {
                            sources.push({
                                url: decodedUrl,
                                quality: `${source.sourceName} (${translationType})`,
                                isM3U8: decodedUrl.includes('.m3u8'),
                                type: translationType
                            });
                        }
                    }
                } catch (e) {
                    // Translation type not available
                    continue;
                }
            }

            return { sources };
        } catch (err: any) {
            console.error("AllAnime Source Error:", err.message);
            return { sources: [] };
        }
    }

    decodeUrl(encodedUrl: string): string | null {
        try {
            // AllAnime uses a simple encoding
            if (encodedUrl.startsWith('-')) {
                // Remove the leading dash and decode
                const decoded = Buffer.from(encodedUrl.slice(1), 'base64').toString('utf-8');
                return decoded;
            }
            return encodedUrl;
        } catch {
            return null;
        }
    }
}
