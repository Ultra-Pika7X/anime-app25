
const ANILIST_API_URL = 'https://graphql.anilist.co';

export interface AnilistMedia {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
    color: string;
  };
  bannerImage?: string;
  description?: string;
  episodes?: number;
  season?: string;
  seasonYear?: number;
  type: 'ANIME' | 'MANGA';
  format?: string;
  status?: string;
  genres?: string[];
  averageScore?: number;
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  };
  recommendations?: {
    nodes: Array<{
      mediaRecommendation: {
        id: number;
        title: {
          romaji: string;
          english: string;
        };
        coverImage: {
          medium: string;
        };
        averageScore?: number;
        format?: string;
        type?: string;
      };
    }>;
  };
  relations?: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        title: {
          romaji: string;
          english: string;
          native: string;
        };
        format: string;
        type: string;
        status: string;
        coverImage: {
          medium: string;
        };
      };
    }>;
  };
}

import { cache } from "@/lib/cache";

// ... (API URL)

export const anilist = {
  async query(query: string, variables: any = {}, accessToken?: string, cacheKey?: string, ttl?: number) {
    // Return cached if available and no user token (user-specific data shouldn't be blindly cached globally unless key is unique to user)
    // If accessToken is provided, caching should be careful or disabled unless key includes userId (which we might not have here easily).
    // For now, only cache public queries (no accessToken) or explicitly keyed ones.
    if (cacheKey && !accessToken) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    if (cacheKey && !accessToken && ttl) {
      cache.set(cacheKey, data, ttl);
    }

    return data;
  },

  async getTrending(page = 1, perPage = 20) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media (sort: TRENDING_DESC, type: ANIME) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            description
            averageScore
            genres
            format
            type
            nextAiringEpisode {
              episode
              timeUntilAiring
            }
          }
        }
      }
    `;
    return this.query(query, { page, perPage }, undefined, `trending_${page}_${perPage}`, 3600);
  },

  async getPopular(page = 1, perPage = 20) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          media (sort: POPULARITY_DESC, type: ANIME) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            format
            averageScore
            genres
            episodes
            seasonYear
            status
          }
        }
      }
    `;

    return this.query(query, { page, perPage }, undefined, `popular_${page}`, 3600);
  },

  async getRecentEpisodes(page = 1, perPage = 20) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          media (sort: UPDATED_AT_DESC, type: ANIME, status: RELEASING) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            format
            averageScore
            genres
            episodes
            seasonYear
            status
          }
        }
      }
    `;

    return this.query(query, { page, perPage }, undefined, `recent_${page}`, 1800);
  },

  async getSearch(query: string, page = 1, perPage = 20) {
    const gqlQuery = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          media (search: $search, sort: POPULARITY_DESC, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            description
            averageScore
            genres
            format
            type
            seasonYear
            idMal
          }
        }
      }
    `;
    return this.query(gqlQuery, { search: query, page, perPage }, undefined, `search_${query}_${page}`, 900); // 15 min cache
  },

  async getInfo(id: number) {
    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          description(asHtml: false)
          episodes
          season
          seasonYear
          status
          genres
          averageScore
          format
          duration
          favourites
          studios {
            nodes {
               name
            }
          }
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
          recommendations(sort: RATING_DESC, page: 1, perPage: 25) {
             nodes {
                mediaRecommendation {
                   id
                   title {
                      romaji
                      english
                   }
                   coverImage {
                      medium
                   }
                   type
                   format
                   status
                   averageScore
                   idMal
                }
             }
          }
          relations {
            edges {
              relationType(version: 2)
              node {
                id
                title {
                  romaji
                  english
                  native
                }
                format
                type
                status
                coverImage {
                  medium
                }
                idMal
              }
            }
          }
        }
      }
    `;
    // Cache for 1 hour to reduce API calls and support offline repeat visits
    return this.query(query, { id }, undefined, `anime_info_${id}`, 3600);
  },

  async getViewer(accessToken: string) {
    const query = `
        query {
            Viewer {
                id
                name
                avatar {
                    large
                }
                options {
                    displayAdultContent
                }
            }
        }
      `;
    return this.query(query, {}, accessToken);
  },

  async getUserMediaList(userId: number, accessToken: string) {
    const query = `
      query ($userId: Int) {
        MediaListCollection(userId: $userId, type: ANIME) {
          lists {
            name
            entries {
              id
              mediaId
              status
              score
              progress
              media {
                id
                idMal
                title {
                  romaji
                  english
                  native
                }
                coverImage {
                   extraLarge
                   large
                }
                format
                episodes
                duration
                genres
                averageScore
                status
              }
            }
          }
        }
      }
    `;
    return this.query(query, { userId }, accessToken);
  },

  async getAiringSchedule(start: number, end: number, page = 1, perPage = 50) {
    const query = `
      query ($start: Int, $end: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            total
          }
          airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME_ASC) {
            id
            airingAt
            episode
            media {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
                medium
                color
              }
              averageScore
              isAdult
              format
              status
            }
          }
        }
      }
    `;
    return this.query(query, { start, end, page, perPage }, undefined, `schedule_${start}_${end}_${page}`, 1800); // 30 min cache
  },

  async getMovies(page = 1, perPage = 20) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          media (type: ANIME, format: MOVIE, sort: POPULARITY_DESC) {
             id
             title {
               romaji
               english
               native
             }
             coverImage {
               extraLarge
               large
               medium
               color
             }
             averageScore
             format
             type
          }
        }
      }
    `;
    return this.query(query, { page, perPage }, undefined, `movies_${page}_${perPage}`, 3600);
  },

  async getTVShows(page = 1, perPage = 20) {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page (page: $page, perPage: $perPage) {
          media (type: ANIME, format: TV, sort: POPULARITY_DESC) {
             id
             title {
               romaji
               english
               native
             }
             coverImage {
               extraLarge
               large
               medium
               color
             }
             averageScore
             format
             type
          }
        }
      }
    `;
    return this.query(query, { page, perPage }, undefined, `tv_${page}_${perPage}`, 3600);
  },

  async getAnimeByGenre(genres: string[], page = 1, perPage = 12) {
    if (!genres || genres.length === 0) return { Page: { media: [] } };

    // Use the first genre max 
    const genre = genres[0];

    const query = `
      query ($page: Int, $perPage: Int, $genre: String) {
        Page (page: $page, perPage: $perPage) {
          media (type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
             id
             title {
               romaji
               english
               native
             }
             coverImage {
               extraLarge
               large
               medium
               color
             }
             averageScore
             format
             type
          }
        }
      }
    `;
    // Cache for 1 hour
    return this.query(query, { page, perPage, genre }, undefined, `genre_${genre}_${page}`, 3600);
  },

  async updateMediaListEntry(id: number, progress: number, status: string, accessToken: string) {
    const query = `
        mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
            SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) {
                id
                progress
                status
            }
        }
      `;
    return this.query(query, { mediaId: id, progress, status }, accessToken);
  }
};
