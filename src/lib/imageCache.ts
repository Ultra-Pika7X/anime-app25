
const DB_NAME = "anime-image-cache";
const STORE_NAME = "images";
const DB_VERSION = 1;

export class ImageCache {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            this.init();
        }
    }

    private async init(): Promise<void> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("ImageCache: Failed to open database");
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME); // Key is the URL string itself
                }
            };
        });

        return this.initPromise;
    }

    async get(url: string): Promise<Blob | null> {
        if (!this.db) await this.init();
        if (!this.db) return null;

        return new Promise((resolve) => {
            const tx = this.db!.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(url);

            req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
            req.onerror = () => resolve(null);
        });
    }

    async save(url: string, blob: Blob): Promise<void> {
        if (!this.db) await this.init();
        if (!this.db) return;

        return new Promise((resolve) => {
            const tx = this.db!.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);

            // Basic storage without metadata for now to keep it simple and fast
            const req = store.put(blob, url);

            req.onsuccess = () => resolve();
            req.onerror = () => {
                console.warn("ImageCache: Failed to save blob", req.error);
                resolve(); // Don't fail the app
            };
        });
    }
}

export const imageCache = new ImageCache();
