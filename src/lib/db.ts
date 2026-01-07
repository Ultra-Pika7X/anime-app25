import { openDB, DBSchema } from 'idb';
import { MediaItem } from '@/types';

interface AnimeAppDB extends DBSchema {
    history: {
        key: number;
        value: MediaItem;
        indexes: { 'timestamp': number };
    };
    watchlist: {
        key: number;
        value: MediaItem;
    };
    episode_progress: {
        key: string; // `${animeId}_${episode}`
        value: {
            key: string;
            animeId: number;
            episode: number;
            progress: number;
            duration: number;
            timestamp: number;
        };
    };
}

const DB_NAME = 'anime-app-db';
const DB_VERSION = 2; // Bump version for new store

export const initDB = async () => {
    return openDB<AnimeAppDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('history')) {
                const historyStore = db.createObjectStore('history', { keyPath: 'id' });
                historyStore.createIndex('timestamp', 'timestamp');
            }
            if (!db.objectStoreNames.contains('watchlist')) {
                db.createObjectStore('watchlist', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('episode_progress')) {
                db.createObjectStore('episode_progress', { keyPath: 'key' });
            }
        },
    });
};

export const dbService = {
    async getHistory() {
        const db = await initDB();
        return db.getAllFromIndex('history', 'timestamp');
    },

    async addToHistory(item: MediaItem) {
        const db = await initDB();
        return db.put('history', item);
    },

    async removeFromHistory(id: number) {
        const db = await initDB();
        return db.delete('history', id);
    },

    async getWatchlist() {
        const db = await initDB();
        return db.getAll('watchlist');
    },

    async addToWatchlist(item: MediaItem) {
        const db = await initDB();
        return db.put('watchlist', item);
    },

    async removeFromWatchlist(id: number) {
        const db = await initDB();
        return db.delete('watchlist', id);
    },

    async clearHistory() {
        const db = await initDB();
        return db.clear('history');
    },

    async saveEpisodeProgress(animeId: number, episode: number, progress: number, duration: number) {
        const db = await initDB();
        const key = `${animeId}_${episode}`;
        return db.put('episode_progress', {
            key, // needed for keypath? actually keyPath is 'key' so object must have it
            animeId,
            episode,
            progress,
            duration,
            timestamp: Date.now()
        });
    },

    async getEpisodeProgress(animeId: number, episode: number) {
        const db = await initDB();
        const key = `${animeId}_${episode}`;
        return db.get('episode_progress', key);
    }
};
