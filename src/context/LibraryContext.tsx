"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    collection,
    query,
    orderBy,
    writeBatch
} from "firebase/firestore";

export interface LibraryItem {
    id: number | string;
    title: string;
    image: string;
    type: "movie" | "tv";
    progress?: number; // 0-100 for watching progress
    timestamp?: number; // last watched
}

interface LibraryContextType {
    history: LibraryItem[];
    watchlist: LibraryItem[];
    addToHistory: (item: LibraryItem) => void;
    removeFromHistory: (id: number | string) => void;
    addToWatchlist: (item: LibraryItem) => void;
    removeFromWatchlist: (id: number | string) => void;
    isInWatchlist: (id: number | string) => boolean;
    clearHistory: () => void;
}

const LibraryContext = createContext<LibraryContextType>({
    history: [],
    watchlist: [],
    addToHistory: () => { },
    removeFromHistory: () => { },
    addToWatchlist: () => { },
    removeFromWatchlist: () => { },
    isInWatchlist: () => false,
    clearHistory: () => { },
});

export const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [history, setHistory] = useState<LibraryItem[]>([]);
    const [watchlist, setWatchlist] = useState<LibraryItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Sync with Firestore when user is logged in
    useEffect(() => {
        if (!user || !db) {
            setHistory([]);
            setWatchlist([]);
            setIsLoaded(true);
            return;
        }

        const historyRef = collection(db, "users", user.uid, "history");
        const watchlistRef = collection(db, "users", user.uid, "watchlist");

        // Real-time listener for History
        const unsubHistory = onSnapshot(query(historyRef, orderBy("timestamp", "desc")), (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            })) as LibraryItem[];
            setHistory(items);
        });

        // Real-time listener for Watchlist
        const unsubWatchlist = onSnapshot(watchlistRef, (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            })) as LibraryItem[];
            setWatchlist(items);
        });

        setIsLoaded(true);

        return () => {
            unsubHistory();
            unsubWatchlist();
        };
    }, [user]);

    // Migration Logic: Merge localStorage into Firestore on first login
    useEffect(() => {
        const migrateData = async () => {
            if (!user || !db) return;

            const localHistorystr = localStorage.getItem("anime_history");
            const localWatchliststr = localStorage.getItem("anime_watchlist");

            if (!localHistorystr && !localWatchliststr) return;

            try {
                const batch = writeBatch(db);
                let hasMigration = false;

                if (localHistorystr) {
                    const localHistory = JSON.parse(localHistorystr) as LibraryItem[];
                    if (localHistory.length > 0) {
                        localHistory.forEach((item) => {
                            const ref = doc(db, "users", user.uid, "history", item.id.toString());
                            batch.set(ref, item);
                        });
                        hasMigration = true;
                    }
                }

                if (localWatchliststr) {
                    const localWatchlist = JSON.parse(localWatchliststr) as LibraryItem[];
                    if (localWatchlist.length > 0) {
                        localWatchlist.forEach((item) => {
                            const ref = doc(db, "users", user.uid, "watchlist", item.id.toString());
                            batch.set(ref, item);
                        });
                        hasMigration = true;
                    }
                }

                if (hasMigration) {
                    await batch.commit();
                    console.log("Migration successful: Local storage merged to Firestore.");
                    // Clear local storage to prevent re-migration
                    localStorage.removeItem("anime_history");
                    localStorage.removeItem("anime_watchlist");
                }
            } catch (error) {
                console.error("Migration failed:", error);
            }
        };

        if (user && isLoaded) {
            migrateData();
        }
    }, [user, isLoaded]);


    const addToHistory = async (item: LibraryItem) => {
        if (!user || !db) return;
        try {
            const ref = doc(db, "users", user.uid, "history", item.id.toString());
            await setDoc(ref, {
                ...item,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error("Error adding to history:", error);
        }
    };

    const removeFromHistory = async (id: number | string) => {
        if (!user || !db) return;
        try {
            const ref = doc(db, "users", user.uid, "history", id.toString());
            await deleteDoc(ref);
        } catch (error) {
            console.error("Error removing from history:", error);
        }
    };

    const addToWatchlist = async (item: LibraryItem) => {
        if (!user || !db) return;
        try {
            const ref = doc(db, "users", user.uid, "watchlist", item.id.toString());
            await setDoc(ref, item);
        } catch (error) {
            console.error("Error adding to watchlist:", error);
        }
    };

    const removeFromWatchlist = async (id: number | string) => {
        if (!user || !db) return;
        try {
            const ref = doc(db, "users", user.uid, "watchlist", id.toString());
            await deleteDoc(ref);
        } catch (error) {
            console.error("Error removing from watchlist:", error);
        }
    };

    const isInWatchlist = (id: number | string) => {
        return watchlist.some((i) => i.id.toString() === id.toString());
    };

    const clearHistory = async () => {
        if (!user || !db) return;
        try {
            const batch = writeBatch(db);
            history.forEach((item) => {
                const ref = doc(db, "users", user.uid, "history", item.id.toString());
                batch.delete(ref);
            });
            await batch.commit();
        } catch (error) {
            console.error("Error clearing history:", error);
        }
    };

    return (
        <LibraryContext.Provider
            value={{
                history,
                watchlist,
                addToHistory,
                removeFromHistory,
                addToWatchlist,
                removeFromWatchlist,
                isInWatchlist,
                clearHistory,
            }}
        >
            {children}
        </LibraryContext.Provider>
    );
};

export const useLibrary = () => useContext(LibraryContext);
