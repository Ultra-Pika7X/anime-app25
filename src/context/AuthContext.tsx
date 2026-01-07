"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { anilist } from "@/lib/anilist";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

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

interface AuthContextType {
    user: AniListUser | null;
    firebaseUser: User | null; // Added
    token: string | null;
    loading: boolean;
    settings: AppSettings;
    updateSettings: (settings: Partial<AppSettings>) => void;
    login: (accessToken: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null, // Default
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
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
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

    // Firebase Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setFirebaseUser(currentUser);
            // We only stop loading if we have checked BOTH (Anilist check below handles its own loading state part, 
            // but we need a unified loading state. 
            // Actually, for the GATE, we primarily care about Firebase loading. 
            // The AniList token check is synchronous (localStorage) + async fetch.
            // Let's keep loading true until Firebase decides.
            if (!currentUser) {
                // If no firebase user, we are strictly "not logged in" for the gate.
                // Even if we have an AniList token, it doesn't matter for the gate if we enforce Firebase.
                // But wait, user might have old AniList token but no Firebase? 
                // Plan says: "No app content may be visible before login". 
                // So if !firebaseUser -> Redirect.
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Check for token in localStorage on mount
        // This runs independently of Firebase for now to restore AniList session
        const storedToken = localStorage.getItem("anilist_token");
        if (storedToken) {
            setToken(storedToken);
            fetchUser(storedToken);
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
                localStorage.removeItem("anilist_token");
                setToken(null);
            }
        } catch (error) {
            console.error("Failed to fetch AniList user:", error);
            // Don't auto-logout from Firebase just because AniList failed, 
            // but maybe clear invalid AniList token?
        }
    };

    const login = async (accessToken: string) => {
        localStorage.setItem("anilist_token", accessToken);
        setToken(accessToken);
        await fetchUser(accessToken);
        // Do NOT redirect here, as this might be called from within the app
    };

    const logout = async () => {
        // Clear everything
        localStorage.removeItem("anilist_token");
        setToken(null);
        setUser(null);
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Firebase signout error", e);
        }
        setFirebaseUser(null);
        router.push("/login");
    };

    // Derived loading state? 
    // If firebase is checking (initial load), loading is true.
    // We handle this via the onAuthStateChanged setting loading=false.

    return (
        <AuthContext.Provider value={{ user, firebaseUser, token, loading, login, logout, settings, updateSettings }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
