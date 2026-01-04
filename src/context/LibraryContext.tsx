"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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
    const [history, setHistory] = useState<LibraryItem[]>([]);
    const [watchlist, setWatchlist] = useState<LibraryItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem("anime_history");
            const savedWatchlist = localStorage.getItem("anime_watchlist");

            if (savedHistory) setHistory(JSON.parse(savedHistory));
            if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));
        } catch (error) {
            console.error("Failed to load library from storage:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("anime_history", JSON.stringify(history));
    }, [history, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("anime_watchlist", JSON.stringify(watchlist));
    }, [watchlist, isLoaded]);

    const addToHistory = (item: LibraryItem) => {
        setHistory((prev) => {
            // Remove existing entry for same ID to push to top
            const filtered = prev.filter((i) => i.id !== item.id);
            return [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 50); // Keep last 50
        });
    };

    const removeFromHistory = (id: number | string) => {
        setHistory((prev) => prev.filter((i) => i.id !== id));
    };

    const addToWatchlist = (item: LibraryItem) => {
        setWatchlist((prev) => {
            if (prev.some((i) => i.id === item.id)) return prev;
            return [item, ...prev];
        });
    };

    const removeFromWatchlist = (id: number | string) => {
        setWatchlist((prev) => prev.filter((i) => i.id !== id));
    };

    const isInWatchlist = (id: number | string) => {
        return watchlist.some((i) => i.id === id);
    };

    const clearHistory = () => {
        setHistory([]);
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
