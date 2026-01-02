"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { User, Mail, Shield, Monitor, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;

    const renderContent = () => {
        switch (activeTab) {
            case "profile":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Profile Settings</h2>
                            <p className="text-muted-foreground">Manage your public profile information.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-3xl font-bold text-primary shadow-[0_0_30px_rgba(97,82,223,0.2)]">
                                    {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : "U"}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-medium text-white">{user.displayName || "User"}</h3>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    <Button size="sm" variant="outline" className="rounded-full border-white/10 hover:bg-white/10">
                                        Change Avatar
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80">Display Name</label>
                                    <input
                                        type="text"
                                        defaultValue={user.displayName || ""}
                                        className="w-full h-10 rounded-xl bg-black/40 border border-white/10 px-4 text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80">Bio</label>
                                    <textarea
                                        className="w-full h-32 rounded-xl bg-black/40 border border-white/10 p-4 text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button className="bg-primary text-white rounded-full px-8 hover:bg-primary/90">
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case "account":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Account Settings</h2>
                            <p className="text-muted-foreground">Manage your account details and security.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-white">Email Address</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                                        Change
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-white">Password</p>
                                        <p className="text-sm text-muted-foreground">••••••••••••</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                                        Change
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/10">
                                <h3 className="text-red-400 font-medium mb-4">Danger Zone</h3>
                                <Button
                                    variant="outline"
                                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full justify-start"
                                    onClick={() => logout()}
                                >
                                    Log Out
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            case "appearance":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Appearance</h2>
                            <p className="text-muted-foreground">Customize your viewing experience.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="cursor-pointer group relative p-4 rounded-xl border-2 border-primary bg-black/40 overflow-hidden">
                                    <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                    </div>
                                    <div className="h-24 rounded-lg bg-[#0a0a0a] border border-white/10 mb-3 px-2 py-3 space-y-2">
                                        <div className="h-2 w-3/4 rounded-full bg-white/10" />
                                        <div className="h-2 w-1/2 rounded-full bg-white/10" />
                                        <div className="flex gap-2 pt-2">
                                            <div className="h-8 w-8 rounded bg-primary/20" />
                                            <div className="h-8 w-8 rounded bg-white/5" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-white text-center">Dark (Default)</p>
                                </div>
                                <div className="cursor-pointer group relative p-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 opacity-50 hover:opacity-100 transition-all">
                                    <div className="h-24 rounded-lg bg-white border border-black/10 mb-3 px-2 py-3 space-y-2">
                                        <div className="h-2 w-3/4 rounded-full bg-black/10" />
                                        <div className="h-2 w-1/2 rounded-full bg-black/10" />
                                        <div className="flex gap-2 pt-2">
                                            <div className="h-8 w-8 rounded bg-indigo-500/20" />
                                            <div className="h-8 w-8 rounded bg-black/5" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-white text-center">Light</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 space-y-1">
                            <h1 className="text-2xl font-black tracking-tight text-white px-4 mb-6">Settings</h1>

                            <button
                                onClick={() => setActiveTab("profile")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    activeTab === "profile"
                                        ? "bg-primary text-white shadow-[0_0_20px_rgba(97,82,223,0.3)]"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <User className="h-5 w-5" />
                                Profile
                                {activeTab === "profile" && <ChevronRight className="ml-auto h-4 w-4" />}
                            </button>

                            <button
                                onClick={() => setActiveTab("account")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    activeTab === "account"
                                        ? "bg-primary text-white shadow-[0_0_20px_rgba(97,82,223,0.3)]"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Shield className="h-5 w-5" />
                                Account
                                {activeTab === "account" && <ChevronRight className="ml-auto h-4 w-4" />}
                            </button>

                            <button
                                onClick={() => setActiveTab("appearance")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    activeTab === "appearance"
                                        ? "bg-primary text-white shadow-[0_0_20px_rgba(97,82,223,0.3)]"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Monitor className="h-5 w-5" />
                                Appearance
                                {activeTab === "appearance" && <ChevronRight className="ml-auto h-4 w-4" />}
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
