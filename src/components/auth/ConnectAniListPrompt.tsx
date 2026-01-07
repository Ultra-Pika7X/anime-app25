"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Sparkles } from "lucide-react";
import { AnilistLogin } from "./AnilistLogin";

export function ConnectAniListPrompt() {
    const { user, token } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show if not connected (no user/token) AND not dismissed
        const isDismissed = localStorage.getItem("anilist_prompt_dismissed");
        if (!user && !token && !isDismissed) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [user, token]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("anilist_prompt_dismissed", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-6 mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-600/10 opacity-50" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center md:text-left">
                    <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Sync your progress</h3>
                        <p className="text-sm text-muted-foreground">
                            Link your AniList account to enable sync, list tracking, and continue watching across devices.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Scale down the button slightly to fit context */}
                    <div className="scale-90 origin-right">
                        <AnilistLogin />
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
