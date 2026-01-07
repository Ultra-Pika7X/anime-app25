import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DownloadMetadata {
    id: string; // `${animeId}-${episodeNumber}`
    animeId: string;
    episodeNumber: number;
    title: string;
    image: string;
    fileName: string;
    status: 'pending' | 'downloading' | 'completed' | 'error';
    progress: number;
    timestamp: number;
    size?: number;
}

interface DownloadsDB extends DBSchema {
    downloads: {
        key: string;
        value: DownloadMetadata;
    };
}

class DownloadManager {
    private dbPromise: Promise<IDBPDatabase<DownloadsDB>> | null = null;
    private root: FileSystemDirectoryHandle | null = null;
    private abortControllers: Map<string, AbortController> = new Map();

    private getDB(): Promise<IDBPDatabase<DownloadsDB>> {
        if (typeof window === 'undefined') {
            return Promise.reject(new Error('IndexedDB not available on server'));
        }
        if (!this.dbPromise) {
            this.dbPromise = openDB<DownloadsDB>('anime-downloads', 1, {
                upgrade(db) {
                    db.createObjectStore('downloads', { keyPath: 'id' });
                },
            });
        }
        return this.dbPromise;
    }

    private async initRoot() {
        if (typeof navigator !== 'undefined' && navigator.storage && !this.root) {
            try {
                this.root = await navigator.storage.getDirectory();
            } catch (e) {
                console.error("OPFS not supported", e);
            }
        }
    }

    async startDownload(url: string, metadata: Omit<DownloadMetadata, 'status' | 'progress' | 'timestamp' | 'fileName'>, onProgress?: (p: number) => void) {
        await this.initRoot();
        if (!this.root) return; // OPFS not ready

        const id = metadata.id;
        const fileName = `${id}.mp4`;
        const controller = new AbortController();
        this.abortControllers.set(id, controller);

        const db = await this.getDB();
        await db.put('downloads', {
            ...metadata,
            fileName,
            status: 'downloading',
            progress: 0,
            timestamp: Date.now()
        });

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            if (!response.body) throw new Error("No body");

            const contentLength = Number(response.headers.get('Content-Length') || 0);
            let downloaded = 0;

            const fileHandle = await this.root.getFileHandle(fileName, { create: true });

            // @ts-ignore - createWritable exists on FileSystemFileHandle in most modern browsers supporting OPFS
            const writable = await fileHandle.createWritable();

            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    await writable.write(value);
                    downloaded += value.length;

                    if (contentLength > 0) {
                        const progress = (downloaded / contentLength) * 100;
                        if (onProgress) onProgress(progress);

                        // Throttle DB updates?
                        // For now, let's just update periodically or rely on in-memory state for UI?
                        // Writing to IDB on every chunk is bad.
                    }
                }
            }

            await writable.close();

            await db.put('downloads', {
                ...metadata,
                fileName,
                status: 'completed',
                progress: 100,
                timestamp: Date.now(),
                size: downloaded
            });

            this.abortControllers.delete(id);
            console.log(`Download ${id} completed.`);

        } catch (error: any) {
            console.error(`Download ${id} failed:`, error);
            if (error.name !== 'AbortError') {
                await db.put('downloads', {
                    ...metadata,
                    fileName,
                    status: 'error',
                    progress: 0,
                    timestamp: Date.now()
                });
            }
            this.abortControllers.delete(id);
            throw error;
        }
    }

    async cancelDownload(id: string) {
        const controller = this.abortControllers.get(id);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(id);
        }
        // Cleanup Partial?
        await this.deleteDownload(id);
    }

    async deleteDownload(id: string) {
        const db = await this.getDB();
        const item = await db.get('downloads', id);
        await this.initRoot();
        if (item && this.root) {
            try {
                await this.root.removeEntry(item.fileName);
            } catch (e) {
                console.warn("File already gone?", e);
            }
            await db.delete('downloads', id);
        }
    }

    async getDownloadUrl(id: string): Promise<string | null> {
        await this.initRoot();
        if (!this.root) return null;
        try {
            // We need to resolve file handle
            const db = await this.getDB();
            const item = await db.get('downloads', id);
            if (!item || item.status !== 'completed') return null;

            const fileHandle = await this.root.getFileHandle(item.fileName);
            const file = await fileHandle.getFile();
            return URL.createObjectURL(file);
        } catch (e) {
            console.error("Failed to get blob url", e);
            return null;
        }
    }

    async getAllDownloads() {
        if (typeof window === 'undefined') return [];
        const db = await this.getDB();
        return db.getAll('downloads');
    }
}

export const downloadManager = new DownloadManager();
