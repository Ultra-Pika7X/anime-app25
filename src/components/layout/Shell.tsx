"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/common/Sidebar";
import { Navbar } from "@/components/common/Navbar";
import { MobileNav } from "@/components/common/MobileNav";
import { NotificationManager } from "@/components/common/NotificationManager";
import { ConnectAniListPrompt } from "@/components/auth/ConnectAniListPrompt";

export function Shell({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    // If loading, just render children (likely handled by AuthGuard loader or page skeleton)
    // or return null to prevent flash. ideally AuthGuard handles the "loading" state blocking.
    if (loading) return null;

    // Public auth pages that should have a clean layout
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    // Use clean layout only for login/signup
    if (isAuthPage) {
        return <main className="min-h-screen bg-background">{children}</main>;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <Navbar />
            <div className="flex-1 flex flex-col min-h-screen lg:pl-20 transition-all duration-300">
                <main className="flex-1 mt-16 pb-20 lg:pb-8">
                    <div className="container mx-auto px-4 py-8">
                        <ConnectAniListPrompt />
                        {children}
                    </div>
                </main>
            </div>
            <MobileNav />
            <NotificationManager />
        </div>
    );
}
