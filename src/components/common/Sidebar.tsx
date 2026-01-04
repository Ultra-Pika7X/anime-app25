"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    TrendingUp,
    Film,
    Tv,
    Search,
    Library,
    Clock,
    Heart
} from "lucide-react";

const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: TrendingUp, label: "Trending", href: "/trending" },
    { icon: Film, label: "Movies", href: "/movie" },
    { icon: Tv, label: "TV Shows", href: "/tv" },
];

const secondaryItems = [
    { icon: Library, label: "Library", href: "/library" },
    { icon: Clock, label: "History", href: "/history" },
    { icon: Heart, label: "Watchlist", href: "/watchlist" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-16 hidden h-[calc(100vh-4rem)] w-20 flex-col items-center border-r border-white/5 bg-[#0a0a0a]/80 py-6 backdrop-blur-2xl transition-all hover:w-64 lg:flex z-40 group/sidebar">
            <div className="flex w-full flex-col gap-4 px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex h-12 w-full items-center gap-4 rounded-xl px-3 transition-all duration-300",
                                isActive
                                    ? "bg-primary text-white shadow-[0_0_20px_rgba(97,82,223,0.3)]"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className="h-6 w-6 shrink-0" />
                            <span className="text-sm font-bold opacity-0 transition-opacity group-hover/sidebar:opacity-100 whitespace-nowrap">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            <div className="my-6 w-full px-6 group-hover/sidebar:px-4 transition-all">
                <div className="h-px w-full bg-white/5" />
            </div>

            <div className="flex w-full flex-col gap-4 px-3">
                {secondaryItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex h-12 w-full items-center gap-4 rounded-xl px-3 transition-all duration-300",
                                isActive
                                    ? "bg-primary text-white"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className="h-6 w-6 shrink-0" />
                            <span className="text-sm font-bold opacity-0 transition-opacity group-hover/sidebar:opacity-100 whitespace-nowrap">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto flex w-full flex-col gap-4 px-3">
                <Link
                    href="/search"
                    className="flex h-12 w-full items-center gap-4 rounded-xl px-3 text-muted-foreground hover:bg-white/5 hover:text-white transition-all duration-300"
                >
                    <Search className="h-6 w-6 shrink-0" />
                    <span className="text-sm font-bold opacity-0 transition-opacity group-hover/sidebar:opacity-100 whitespace-nowrap">
                        Search
                    </span>
                </Link>
            </div>
        </aside>
    );
}
