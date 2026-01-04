"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { User, Mail, Shield, Monitor, ChevronRight, Save, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { updateProfile, updatePassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";
import Image from "next/image";

export default function SettingsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("profile");
    const [isLoading, setIsLoading] = useState(false);

    // Profile State
    const [displayName, setDisplayName] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [bio, setBio] = useState("");

    // Password State
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Initialize User Data
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (user) {
            setDisplayName(user.displayName || "");
            setPhotoURL(user.photoURL || "");

            // Fetch Bio from Firestore
            const fetchBio = async () => {
                if (db) {
                    try {
                        const docRef = doc(db, "users", user.uid);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            setBio(docSnap.data().bio || "");
                        }
                    } catch (err) {
                        console.error("Failed to fetch bio", err);
                    }
                }
            };
            fetchBio();
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: displayName,
                    photoURL: photoURL
                });

                // Save Bio to Firestore
                if (db) {
                    await setDoc(doc(db, "users", user.uid), {
                        bio: bio,
                        email: user.email,
                        displayName: displayName,
                        photoURL: photoURL
                    }, { merge: true });
                }

                toast.success("Profile updated successfully");
            }
        } catch (error: any) {
            toast.error("Failed to update profile: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);
                toast.success("Password changed successfully");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error: any) {
            toast.error("Failed to change password: " + error.message);
            if (error.code === 'auth/requires-recent-login') {
                toast.error("Please log out and log in again to change your password.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case "profile":
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Profile Settings</h2>
                            <p className="text-muted-foreground">Manage your public profile information.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-muted/20 border border-white/5 space-y-8">
                            {/* Avatar Section */}
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-primary/30 shadow-[0_0_30px_rgba(97,82,223,0.2)]">
                                    {photoURL ? (
                                        <Image src={photoURL} alt="Avatar" fill className="object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                                            {displayName ? displayName[0].toUpperCase() : "U"}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4 w-full max-w-md">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Avatar URL</label>
                                        <input
                                            type="text"
                                            value={photoURL}
                                            onChange={(e) => setPhotoURL(e.target.value)}
                                            placeholder="https://example.com/avatar.jpg"
                                            className="w-full h-10 rounded-xl bg-background/50 border border-white/10 px-4 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-white"
                                        />
                                        <p className="text-xs text-muted-foreground">Paste a direct image link (e.g. from Imgur or Discord).</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full h-10 rounded-xl bg-background/50 border border-white/10 px-4 text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full h-32 rounded-xl bg-background/50 border border-white/10 p-4 text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end border-t border-white/5">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isLoading}
                                    className="bg-primary text-white rounded-full px-8 hover:bg-primary/90 gap-2"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                            <h2 className="text-2xl font-bold text-foreground mb-2">Account Settings</h2>
                            <p className="text-muted-foreground">Manage your account details and security.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-muted/20 border border-white/5 space-y-6">
                            <div className="space-y-6">
                                {/* Read Only Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Email Address</label>
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/10 opacity-70 cursor-not-allowed">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-sm text-foreground">{user.email}</span>
                                        </div>
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Email address cannot be changed for security reasons.</p>
                                </div>

                                {/* Change Password */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full h-10 rounded-xl bg-background/50 border border-white/10 px-4 text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Confirm Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full h-10 rounded-xl bg-background/50 border border-white/10 px-4 text-white focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="secondary"
                                            onClick={handleChangePassword}
                                            disabled={isLoading || !newPassword}
                                            className="bg-white/10 hover:bg-white/20 text-white"
                                        >
                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Update Password
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/10">
                                <h3 className="text-red-400 font-medium mb-4">Danger Zone</h3>
                                <Button
                                    variant="outline"
                                    className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 w-full justify-start"
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
                            <h2 className="text-2xl font-bold text-foreground mb-2">Appearance</h2>
                            <p className="text-muted-foreground">Customize your viewing experience.</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-muted/20 border border-white/5 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <div className="flex gap-2 pt-2">
                                            <div className="h-8 w-8 rounded bg-primary/20" />
                                            <div className="h-8 w-8 rounded bg-white/5" />
                                        </div>
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
                                        <div className="flex gap-2 pt-2">
                                            <div className="h-8 w-8 rounded bg-indigo-500/20" />
                                            <div className="h-8 w-8 rounded bg-black/5" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-foreground text-center">Light</p>
                                </div>

                                {/* System Mode */}
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
                                onClick={() => setActiveTab("profile")}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    activeTab === "profile"
                                        ? "bg-primary text-white shadow-[0_0_20px_rgba(97,82,223,0.3)]"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
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
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
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
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
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
