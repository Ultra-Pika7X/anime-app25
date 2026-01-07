"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { AnilistLogin } from "@/components/auth/AnilistLogin";
import { Button } from "@/components/ui/Button";
import { Play, RotateCw, Settings as SettingsIcon, Trash2, Database, Monitor, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { dbService } from "@/lib/db";
import { cache } from "@/lib/cache";
import { toast } from "sonner";

// Simple accessible switch if not available in UI lib
function SimpleSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (c: boolean) => void }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                checked ? "bg-primary" : "bg-white/10"
            )}
        >
            <span
                className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    checked ? "translate-x-6" : "translate-x-1"
                )}
            />
        </button>
    );
}

export default function SettingsPage() {
    const { user, loading, logout, settings, updateSettings } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("general");

    const handleClearData = async () => {
        if (!confirm("Are you sure? This will clear all local history and cache. This checks/syncs will be reset.")) return;

        try {
            await dbService.clearHistory();
            // Clear Local Cache
            if (typeof window !== "undefined") {
                // Clear matching keys
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith("anime_cache_")) {
                        localStorage.removeItem(key);
                    }
                }
            }
            toast.success("Local data cleared successfully.");
            // Reload to reset states
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            toast.error("Failed to clear data.");
            console.error(e);
        }
    };

    if (loading) return null;
    // Removed Auth Check redirect -> handled by global middleware or auth guard usually, or just show settings for Guest too?
    // Guest should be able to change AutoNext/Theme. 

    const renderContent = () => {
        switch (activeTab) {
            case "general":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Playback</h2>
                            <p className="text-muted-foreground">Customize your viewing experience.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-muted/20 border border-white/5 space-y-6">
                            {/* Auto Next */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-base font-medium text-white flex items-center gap-2">
                                        <Play className="h-4 w-4" /> Auto-Play Next Episode
                                    </div>
                                    <p className="text-sm text-muted-foreground">Automatically play the next episode when the current one finishes.</p>
                                </div>
                                <SimpleSwitch
                                    checked={settings.autoNext}
                                    onCheckedChange={(val) => updateSettings({ autoNext: val })}
                                />
                            </div>

                            {/* Skip Intro */}
                            <div className="flex items-center justify-between border-t border-white/5 pt-6">
                                <div className="space-y-0.5">
                                    <div className="text-base font-medium text-white flex items-center gap-2">
                                        <SkipForward className="h-4 w-4" /> Enable Skip Intro/Outro
                                    </div>
                                    <p className="text-sm text-muted-foreground">Show "Skip Intro" button when available.</p>
                                </div>
                                <SimpleSwitch
                                    checked={settings.enableSkipIntro ?? true}
                                    onCheckedChange={(val) => updateSettings({ enableSkipIntro: val })}
                                />
                            </div>

                            {/* Auto Skip */}
                            <div className="flex items-center justify-between border-t border-white/5 pt-6">
                                <div className="space-y-0.5">
                                    <div className="text-base font-medium text-white flex items-center gap-2">
                                        <Play className="h-4 w-4" /> Auto-Skip Streaming
                                    </div>
                                    <p className="text-sm text-muted-foreground">Automatically skip intros without asking (Experimental).</p>
                                </div>
                                <SimpleSwitch
                                    checked={settings.enableAutoSkip ?? false}
                                    onCheckedChange={(val) => updateSettings({ enableAutoSkip: val })}
                                />
                            </div>

                            {/* Preferred Source */}
                            <div className="flex items-center justify-between border-t border-white/5 pt-6">
                                <div className="space-y-0.5">
                                    <div className="text-base font-medium text-white flex items-center gap-2">
                                        <SettingsIcon className="h-4 w-4" /> Preferred Quality
                                    </div>
                                    <p className="text-sm text-muted-foreground">Preferred streaming quality for auto-selection.</p>
                                </div>
                                <select
                                    value={settings.preferredSource}
                                    onChange={(e) => updateSettings({ preferredSource: e.target.value })}
                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="default">Auto (Default)</option>
                                    <option value="1080p">1080p</option>
                                    <option value="720p">720p</option>
                                    <option value="360p">360p</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2 mt-8">Syncing</h2>
                            <p className="text-muted-foreground">Manage data synchronization.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-muted/20 border border-white/5 space-y-6">
                            {/* Auto Sync AniList */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-base font-medium text-white flex items-center gap-2">
                                        <RotateCw className="h-4 w-4" /> Auto-Sync with AniList
                                    </div>
                                    <p className="text-sm text-muted-foreground">Automatically update your AniList progress as you watch (requires login).</p>
                                    {!user && (
                                        <div className="mt-2">
                                            <AnilistLogin />
                                        </div>
                                    )}
                                </div>
                                <SimpleSwitch
                                    checked={settings.autoSyncAniList}
                                    onCheckedChange={(val) => updateSettings({ autoSyncAniList: val })}
                                />
                            </div>
                        </div>
                    </div>
                );
            case "data":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Data & Storage</h2>
                            <p className="text-muted-foreground">Manage local cache and history.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-muted/20 border border-white/5 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-red-500/10 text-red-500">
                                        <Database className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-medium text-white">Clear Local Cache</h3>
                                        <p className="text-sm text-muted-foreground">Remove cached data like trending lists and search results. Does not delete downloads.</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleClearData}
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear Data
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case "appearance":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Appearance</h2>
                            <p className="text-muted-foreground">Customize UI Theme.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-muted/20 border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Dark Mode */}
                            <div
                                onClick={() => setTheme("dark")}
                                className={cn(
                                    "cursor-pointer group relative p-4 rounded-xl border-2 transition-all",
                                    theme === "dark" ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 bg-background/50"
                                )}
                            >
                                <div className="h-24 rounded-lg bg-[#0a0a0a] border border-white/10 mb-3 px-2 py-3 space-y-2 pointer-events-none">
                                    <div className="h-2 w-3/4 rounded-full bg-white/10" />
                                    <div className="h-2 w-1/2 rounded-full bg-white/10" />
                                </div>
                                <p className="text-sm font-medium text-foreground text-center">Dark</p>
                            </div>

                            {/* Light Mode */}
                            <div
                                onClick={() => setTheme("light")}
                                className={cn(
                                    "cursor-pointer group relative p-4 rounded-xl border-2 transition-all",
                                    theme === "light" ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 bg-background/50"
                                )}
                            >
                                <div className="h-24 rounded-lg bg-white border border-black/10 mb-3 px-2 py-3 space-y-2 pointer-events-none">
                                    <div className="h-2 w-3/4 rounded-full bg-black/10" />
                                    <div className="h-2 w-1/2 rounded-full bg-black/10" />
                                </div>
                                <p className="text-sm font-medium text-foreground text-center">Light</p>
                            </div>

                            <div
                                onClick={() => setTheme("system")}
                                className={cn(
                                    "cursor-pointer group relative p-4 rounded-xl border-2 transition-all",
                                    theme === "system" ? "border-primary bg-primary/5" : "border-white/10 hover:border-white/20 bg-background/50"
                                )}
                            >
                                <div className="h-24 rounded-lg bg-gradient-to-br from-white via-gray-400 to-black border border-white/10 mb-3 flex items-center justify-center opacity-50 pointer-events-none">
                                    <Monitor className="h-8 w-8 text-white" />
                                </div>
                                <p className="text-sm font-medium text-foreground text-center">System</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 space-y-1">
                            <h1 className="text-2xl font-black tracking-tight text-foreground px-4 mb-6">Settings</h1>

                            <button
                                onClick={() => setActiveTab("general")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    activeTab === "general"
                                        ? "bg-primary text-white shadow-[0_0_20px_rgba(97,82,223,0.3)]"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                )}
                            >
                                <SettingsIcon className="h-5 w-5" />
                                General
                            </button>
                            <button
                                onClick={() => setActiveTab("appearance")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    activeTab === "appearance"
                                        ? "bg-primary text-white shadow-[0_0_20px_rgba(97,82,223,0.3)]"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                )}
                            >
                                <Monitor className="h-5 w-5" />
                                Appearance
                            </button>
                            <button
                                onClick={() => setActiveTab("data")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    activeTab === "data"
                                        ? "bg-primary text-white shadow-[0_0_20px_rgba(97,82,223,0.3)]"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                )}
                            >
                                <Database className="h-5 w-5" />
                                Data
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
