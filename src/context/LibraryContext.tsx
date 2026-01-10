"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { anilist } from "@/lib/anilist";
import { MediaItem } from "@/types";
import { dbService } from "@/lib/db";
import {
    doc,
    setDoc,
    deleteDoc,
    getDocs, // Changed from onSnapshot
    collection,
    query,
    orderBy,
    writeBatch,
    getDoc
} from "firebase/firestore";

// Context Definition
export type MediaListStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';

const LibraryContext = createContext<any>(undefined);

export const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, token, settings } = useAuth();
    const [history, setHistory] = useState<MediaItem[]>([]);
    const [mediaList, setMediaList] = useState<any[]>([]);
    const [watchlist, setWatchlist] = useState<MediaItem[]>([]);

    // Track last sync state for throttling { [docId]: { time: number, progress: number } }
    const lastSyncRef = React.useRef<{ [key: string]: { time: number, progress: number } }>({});

    // Pending AniList sync queue (for offline episodes)
    const [pendingSyncs, setPendingSyncs] = useState<{ animeId: number; episode: number; totalEpisodes: number }[]>([]);
    const syncInProgressRef = React.useRef(false);

    // ... Derived State

    const loadAniListCollection = useCallback(async () => {
        if (!user || !token) return;
        try {
            // Using User ID based cache key if possible, but for now simple fetch
            const data = await anilist.getUserMediaList(Number(user.id), token);
            if (data?.MediaListCollection?.lists) {
                const allEntries = data.MediaListCollection.lists.flatMap((list: any) => list.entries);
                setMediaList(allEntries);
            }
        } catch (e) {
            console.error("Failed to load AniList collection", e);
        }
    }, [user, token]);

    // 1. Load Local History & Sync
    useEffect(() => {
        const loadLocal = async () => {
            const h = await dbService.getHistory();
            h.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setHistory(h);
        };
        loadLocal();
        loadAniListCollection();
    }, [loadAniListCollection]);

    // 2. Sync Firestore History (One-time fetch instead of onSnapshot)
    useEffect(() => {
        if (!user || !db) return;

        const syncRemoteHistory = async () => {
            const userId = user.id.toString();
            const historyRef = collection(db, "users", userId, "history");
            const q = query(historyRef, orderBy("timestamp", "desc"));

            try {
                const snapshot = await getDocs(q);
                const remoteItems = snapshot.docs.map((doc) => ({ ...doc.data() })) as MediaItem[];

                // Merge strategy: Remote wins if newer? Or simpler: add all remote to local
                for (const item of remoteItems) {
                    await dbService.addToHistory(item);
                }
                const merged = await dbService.getHistory();
                merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                setHistory(merged);
            } catch (e) {
                console.error("History sync failed", e);
            }
        };

        syncRemoteHistory();
    }, [user]);

    // Actions

    // ... updateStatus, addToWatchlist etc unchanged ...
    const updateStatus = async (id: number, status: MediaListStatus, progress?: number) => {
        if (!token) return;

        // Optimistic Update
        setMediaList(prev => {
            const existingIdx = prev.findIndex(item => item.media.id === id);
            if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = { ...updated[existingIdx], status, progress: progress ?? updated[existingIdx].progress };
                return updated;
            } else {
                return prev;
            }
        });

        try {
            await anilist.updateMediaListEntry(id, progress || 0, status, token);
            await loadAniListCollection();
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const addToWatchlist = async (item: MediaItem) => {
        if (!token) return;
        await updateStatus(item.id, "PLANNING");
    };

    const removeFromWatchlist = async (id: number) => {
        console.warn("Remove from watchlist not fully implemented (requires delete mutation).");
    };

    const isInWatchlist = (id: number) => {
        return mediaList.some((i) => i.media.id === id && (i.status === "PLANNING" || i.status === "CURRENT"));
    };

    const addToHistory = async (item: MediaItem) => {
        await dbService.addToHistory(item);
        const newHistory = await dbService.getHistory();
        newHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setHistory(newHistory);

        // Sync to cloud (Debounce/Throttle or just write)
        // For history (card click), it's rare enough to write immediately usually.
        if (user && db) {
            const userId = user.id.toString();
            const docId = item.id.toString();
            const ref = doc(db, "users", userId, "history", docId);
            await setDoc(ref, { ...item, timestamp: Date.now() });
        }
    };

    const removeFromHistory = async (id: number) => {
        await dbService.removeFromHistory(id);
        const h = await dbService.getHistory(); // reload
        setHistory(h);
        if (user && db) {
            await deleteDoc(doc(db, "users", user.id.toString(), "history", id.toString()));
        }
    };

    const clearHistory = async () => {
        await dbService.clearHistory();
        setHistory([]);
        if (user && db) {
            // Batch delete is fine for cleanup
            const userId = user.id.toString();
            const batch = writeBatch(db);
            history.forEach((item) => {
                batch.delete(doc(db, "users", userId, "history", item.id.toString()));
            });
            await batch.commit();
        }
    };

    const markEpisodeComplete = async (item: MediaItem) => {
        await addToHistory({ ...item, progress: item.duration, timestamp: Date.now() });

        // Only sync to AniList if enabled in settings
        if (settings.autoSyncAniList) {
            const episodeNumber = item.watchedEpisode || 1;
            const totalEpisodes = item.episodes || 0;

            if (token) {
                // Online: Sync immediately
                let status: MediaListStatus = "CURRENT";
                if (totalEpisodes > 0 && episodeNumber >= totalEpisodes) status = "COMPLETED";
                await updateStatus(item.id, status, episodeNumber);
            } else {
                // Offline: Queue for later batch sync
                setPendingSyncs(prev => {
                    // Dedupe: Keep only the highest episode for each anime
                    const existing = prev.findIndex(p => p.animeId === item.id);
                    if (existing >= 0) {
                        if (episodeNumber > prev[existing].episode) {
                            const updated = [...prev];
                            updated[existing] = { animeId: item.id, episode: episodeNumber, totalEpisodes };
                            return updated;
                        }
                        return prev;
                    }
                    return [...prev, { animeId: item.id, episode: episodeNumber, totalEpisodes }];
                });

                // Save to localStorage for persistence
                const queueKey = "anilist_pending_sync";
                const currentQueue = JSON.parse(localStorage.getItem(queueKey) || "[]");
                const dedupedQueue = currentQueue.filter((q: any) => q.animeId !== item.id);
                dedupedQueue.push({ animeId: item.id, episode: episodeNumber, totalEpisodes });
                localStorage.setItem(queueKey, JSON.stringify(dedupedQueue));
            }
        }
    };

    // Batch sync pending updates when coming online
    const syncPendingUpdates = useCallback(async () => {
        if (!token || syncInProgressRef.current) return;

        const queueKey = "anilist_pending_sync";
        const queue = JSON.parse(localStorage.getItem(queueKey) || "[]");

        if (queue.length === 0) return;

        syncInProgressRef.current = true;
        console.log(`Syncing ${queue.length} pending AniList updates...`);

        try {
            for (const item of queue) {
                // Delay between requests to avoid rate limiting
                await new Promise(r => setTimeout(r, 500));

                let status: MediaListStatus = "CURRENT";
                if (item.totalEpisodes > 0 && item.episode >= item.totalEpisodes) {
                    status = "COMPLETED";
                }

                await updateStatus(item.animeId, status, item.episode);
            }

            // Clear queue on success
            localStorage.removeItem(queueKey);
            setPendingSyncs([]);
            console.log("Pending AniList sync complete!");
        } catch (e) {
            console.error("Failed to sync pending updates", e);
        } finally {
            syncInProgressRef.current = false;
        }
    }, [token, updateStatus]);

    // Sync pending updates when token becomes available (login) or app regains focus
    useEffect(() => {
        if (token) {
            syncPendingUpdates();
        }

        // Also sync when window regains focus (coming back online)
        const handleFocus = () => {
            if (token) syncPendingUpdates();
        };

        window.addEventListener("focus", handleFocus);
        window.addEventListener("online", handleFocus);

        return () => {
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("online", handleFocus);
        };
    }, [token, syncPendingUpdates]);

    const saveEpisodeProgress = async (animeId: number, episode: number, progress: number, duration: number) => {
        // 1. Local Write (Always, cheap)
        await dbService.saveEpisodeProgress(animeId, episode, progress, duration);

        // 2. Cloud Sync (Optimized for Spark Plan)
        if (user && db) {
            const now = Date.now();
            const docId = `${animeId}_${episode}`;

            // State tracking for throttling
            // We need to know previous saved values to calc % change. 
            // We can store this in a Ref map: { [docId]: { time: number, progress: number } }
            // Let's assume we update the ref below.

            const lastSync = lastSyncRef.current[docId];
            const lastTime = lastSync?.time || 0;
            const lastProgress = lastSync?.progress || 0;

            const timeDiff = now - lastTime;
            const progressDiff = Math.abs(progress - lastProgress);
            const totalDuration = duration || 1;
            const percentChange = progressDiff / totalDuration;

            // Sync triggers:
            // 1. > 5% progress change
            // 2. > 60 seconds since last sync (heartbeat)
            // 3. Just started (> 0 and < 1% but first write? maybe skip first write to avoid noise)
            // 4. Almost finished (> 95% and changed)
            // 5. Explicit "Complete" usually handled by markEpisodeComplete separately?

            const shouldSync =
                percentChange > 0.05 ||
                (timeDiff > 60000 && progressDiff > 0) ||
                (progress / totalDuration > 0.95 && percentChange > 0.01);

            if (shouldSync) {
                lastSyncRef.current[docId] = { time: now, progress };
                const userId = user.id.toString();
                // Use setDoc with merge: true implicitly or explicit
                // We utilize setDoc which overwrites or merges if option given, generally setDoc defaults to overwrite unless merge:true.
                // But for specific doc structure we just overwrite is fine as we possess all data.
                setDoc(doc(db, "users", userId, "episode_progress", docId), {
                    animeId, episode, progress, duration, timestamp: now
                }).catch(e => console.error("Firestore sync failed", e));
            }
        }
    };

    const getEpisodeProgress = async (animeId: number, episode: number) => {
        // 1. Check local DB first
        const local = await dbService.getEpisodeProgress(animeId, episode);
        if (local) return local;

        // 2. Fallback to Remote Firestore (if online and logged in)
        if (user && db) {
            try {
                const userId = user.id.toString();
                const docId = `${animeId}_${episode}`;
                const docRef = doc(db, "users", userId, "episode_progress", docId);
                const snapshot = await getDoc(docRef);

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    // Save to local for next time
                    await dbService.saveEpisodeProgress(
                        animeId,
                        episode,
                        data.progress,
                        data.duration
                    );
                    return {
                        ...data,
                        animeId,
                        episode
                    };
                }
            } catch (e) {
                console.error("Failed to fetch remote progress", e);
            }
        }

        return undefined;
    };

    return (
        <LibraryContext.Provider
            value={{
                history,
                watchlist,
                mediaList,
                addToHistory,
                removeFromHistory,
                addToWatchlist,
                removeFromWatchlist,
                isInWatchlist,
                clearHistory,
                markEpisodeComplete,
                saveEpisodeProgress,
                getEpisodeProgress,
                updateStatus,
                syncPendingUpdates,
                pendingSyncs
            }}
        >
            {children}
        </LibraryContext.Provider>
    );
};
export const useLibrary = () => useContext(LibraryContext);
