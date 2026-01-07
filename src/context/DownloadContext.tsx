"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { downloadManager } from "@/lib/downloadManager";

interface DownloadItem {
    id: string;
    animeId: string;
    episodeNumber: number;
    title: string;
    image: string;
    status: 'pending' | 'downloading' | 'completed' | 'error';
    progress: number;
    timestamp: number;
    size?: number;
}

interface DownloadContextType {
    downloads: DownloadItem[];
    startDownload: (url: string, animeId: string, episodeNumber: number, title: string, image: string) => Promise<void>;
    deleteDownload: (id: string) => Promise<void>;
    getDownloadUrl: (id: string) => Promise<string | null>;
    refreshDownloads: () => Promise<void>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: React.ReactNode }) {
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);

    const refreshDownloads = useCallback(async () => {
        const all = await downloadManager.getAllDownloads();
        // Sort by timestamp desc
        setDownloads(all.sort((a, b) => b.timestamp - a.timestamp));
    }, []);

    useEffect(() => {
        refreshDownloads();
    }, [refreshDownloads]);

    const startDownload = async (url: string, animeId: string, episodeNumber: number, title: string, image: string) => {
        const id = `${animeId}-${episodeNumber}`;

        // Optimistic update
        setDownloads(prev => {
            const existing = prev.filter(p => p.id !== id);
            return [{
                id, animeId, episodeNumber, title, image, status: 'downloading', progress: 0, timestamp: Date.now()
            }, ...existing];
        });

        try {
            await downloadManager.startDownload(url, {
                id,
                animeId,
                episodeNumber,
                title,
                image
            }, (progress) => {
                // Update progress in state
                // This might cause too many re-renders, maybe throttle?
                // For now, simple.
                setDownloads(prev => prev.map(item => item.id === id ? { ...item, progress } : item));
            });
            await refreshDownloads();
        } catch (error) {
            console.error("Download failed context wrapper", error);
            await refreshDownloads(); // Status should be error
            throw error;
        }
    };

    const deleteDownload = async (id: string) => {
        await downloadManager.deleteDownload(id);
        await refreshDownloads();
    };

    const getDownloadUrl = async (id: string) => {
        return await downloadManager.getDownloadUrl(id);
    };

    return (
        <DownloadContext.Provider value={{ downloads, startDownload, deleteDownload, getDownloadUrl, refreshDownloads }}>
            {children}
        </DownloadContext.Provider>
    );
}

export function useDownloads() {
    const context = useContext(DownloadContext);
    if (context === undefined) {
        throw new Error("useDownloads must be used within a DownloadProvider");
    }
    return context;
}
