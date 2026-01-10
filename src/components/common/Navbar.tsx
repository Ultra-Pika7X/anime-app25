"use client";

import Link from "next/link";
import { Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [query, setQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const router = useRouter();
    const { user, firebaseUser, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <header
            className={cn(
                "fixed top-0 z-50 w-full transition-all duration-300 h-16 border-b border-white/5",
                isScrolled ? "bg-background/80 backdrop-blur-2xl" : "bg-transparent"
            )}
        >
            <div className="container flex h-full items-center justify-between gap-4 px-4 md:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-black tracking-tighter text-primary">
                            CloudAnime
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/schedule" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-2 py-1">
                            Schedule
                        </Link>
                    </nav>
                </div>

                <div className="flex flex-1 items-center justify-center max-w-xl">
                    <form onSubmit={handleSearch} className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search anime..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </form>
                </div>

                <div className="flex items-center gap-3">
                    {(user || firebaseUser) ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 overflow-hidden",
                                    isDropdownOpen
                                        ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(97,82,223,0.5)]"
                                        : "bg-white/10 text-white hover:bg-white/20 border-white/10 hover:border-white/20"
                                )}
                            >
                                {(user?.avatar?.large || firebaseUser?.photoURL) ? (
                                    <img
                                        src={user?.avatar?.large || firebaseUser?.photoURL || ""}
                                        alt={user?.name || firebaseUser?.displayName || "User"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="font-bold text-sm">
                                        {(user?.name || firebaseUser?.displayName || "U")[0].toUpperCase()}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-3 w-60 origin-top-right rounded-2xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-3 py-3 border-b border-white/5 mb-1">
                                            <p className="text-xs font-medium text-muted-foreground mb-1">Signed in as</p>
                                            <p className="text-sm font-bold truncate text-white">{user?.name || firebaseUser?.displayName || firebaseUser?.email || "User"}</p>
                                        </div>
                                        <div className="mt-1 space-y-1">
                                            <Link
                                                href="/settings"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                <User className="h-4 w-4" />
                                                Settings
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button size="sm" className="rounded-full bg-primary px-6 font-bold shadow-[0_0_20px_rgba(97,82,223,0.3)] hover:shadow-[0_0_30px_rgba(97,82,223,0.5)] transition-all">
                                Login
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
