"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { anilist } from "@/lib/anilist";
import { useRouter } from "next/navigation";

// Define a type for the AniList User (simplified from the API response)
export interface AniListUser {
    id: number;
    name: string;
    avatar: {
        large: string;
    };
    options?: {
        displayAdultContent: boolean;
    };
}

export interface AppSettings {
    autoNext: boolean;
    autoNextTimeout: number; // seconds
    autoSyncAniList: boolean;
    preferredSource: string; // "navtive", "720p", "1080p", etc. or source ID
    enableSkipIntro?: boolean;
    enableAutoSkip?: boolean; // Auto-click skip button
}

// ...

interface AuthContextType {
    user: AniListUser | null;
    token: string | null;
    loading: boolean;
    settings: AppSettings;
    updateSettings: (settings: Partial<AppSettings>) => void;
    login: (accessToken: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    settings: {
        autoNext: true,
        autoNextTimeout: 5,
        autoSyncAniList: true,
        preferredSource: "default",
        enableSkipIntro: true,
        enableAutoSkip: false
    },
    updateSettings: () => { },
    login: async () => { },
    logout: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AniListUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<AppSettings>({
        autoNext: true,
        autoNextTimeout: 5,
        autoSyncAniList: true,
        preferredSource: "default",
        enableSkipIntro: true,
        enableAutoSkip: false
    });
    const router = useRouter();

    useEffect(() => {
        // Check for token in localStorage on mount
        const storedToken = localStorage.getItem("anilist_token");
        if (storedToken) {
            setToken(storedToken);
            fetchUser(storedToken);
        } else {
            setLoading(false);
        }

        // Load Settings
        const storedSettings = localStorage.getItem("app_settings");
        if (storedSettings) {
            try {
                setSettings({ ...settings, ...JSON.parse(storedSettings) });
            } catch (e) {
                console.error("Invalid settings", e);
            }
        }
    }, []);

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem("app_settings", JSON.stringify(updated));
    };

    const fetchUser = async (accessToken: string) => {
        try {
            const data = await anilist.getViewer(accessToken);
            if (data.data && data.data.Viewer) {
                setUser(data.data.Viewer);
            } else {
                // Token might be invalid
                logout();
            }
        } catch (error) {
            console.error("Failed to fetch AniList user:", error);
            // If API fails (e.g. 401), logout
            logout();
        } finally {
            setLoading(false);
        }
    };
    const login = async (accessToken: string) => {
        setLoading(true);
        localStorage.setItem("anilist_token", accessToken);
        setToken(accessToken);
        await fetchUser(accessToken);
        router.push("/");
    };

    const logout = () => {
        localStorage.removeItem("anilist_token");
        setToken(null);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, settings, updateSettings }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
