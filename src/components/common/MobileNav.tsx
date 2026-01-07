"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    Search,
    Compass,
    Library,
    Calendar
} from "lucide-react";

// Mobile specific nav items (fewer items to fit width)
const mobileNavItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Trending", href: "/trending" },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Library, label: "Library", href: "/watchlist" }, // "Watchlist" more relevant for simplified nav
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-2xl lg:hidden safe-area-pb">
            <div className="flex h-full items-center justify-around px-2">
                {mobileNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
