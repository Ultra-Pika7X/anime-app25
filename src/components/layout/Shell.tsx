"use client";

import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/common/Sidebar";
import { Navbar } from "@/components/common/Navbar";
import { usePathname } from "next/navigation";

export function Shell({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    // If loading, just render children (likely handled by AuthGuard loader or page skeleton)
    // or return null to prevent flash. ideally AuthGuard handles the "loading" state blocking.
    if (loading) return null;

    // Public routes that should have a clean layout (Login/Signup)
    const isPublicPage = pathname === "/login" || pathname === "/signup";

    // If user is not logged in OR we are on a public page (even if logged in, just in case),
    // render clean layout.
    // Note: AuthGuard redirects logged in users away from /login, but if they land on it briefly,
    // we don't want the sidebar.
    if (!user || isPublicPage) {
        return <main className="min-h-screen bg-background">{children}</main>;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <Navbar />
            <div className="flex-1 flex flex-col min-h-screen lg:pl-20 transition-all duration-300">
                <main className="flex-1 mt-16 pb-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
