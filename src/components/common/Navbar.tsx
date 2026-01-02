"use client";

import Link from "next/link";
import { Search, Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [query, setQuery] = useState("");
    const router = useRouter();
    const { user, logout } = useAuth();

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
                </div>

                <div className="flex flex-1 items-center justify-center max-w-xl">
                    <form onSubmit={handleSearch} className="relative w-full group">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search anime..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                    </form>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="hidden md:flex rounded-full text-white/70 hover:bg-white/10 hover:text-white">
                        <Bell className="h-5 w-5" />
                    </Button>

                    {user ? (
                        <div className="relative group/profile">
                            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-primary font-bold shadow-[0_0_15px_rgba(97,82,223,0.2)] hover:bg-primary/30 transition-all">
                                {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : "U"}
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="px-3 py-2 border-b border-white/5 mb-1">
                                    <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                                    <p className="text-sm font-bold truncate text-white">{user.email}</p>
                                </div>
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <User className="h-4 w-4" />
                                    Settings
                                </Link>
                                <button
                                    onClick={() => logout()}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
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
