"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            const isPublicPath = pathname === "/login" || pathname === "/signup";

            if (!user && !isPublicPath) {
                // Not logged in and trying to access private route -> redirect to login
                router.push("/login");
            } else if (user && isPublicPath) {
                // Logged in and trying to access public route -> redirect to home
                router.push("/");
            } else {
                // Access granted
                setIsAuthorized(true);
            }
        }
    }, [user, loading, pathname, router]);

    // Show loading while checking auth state or while redirecting
    if (loading || !isAuthorized) {
        // Only show loading if we are not on a public path (to avoid flash on login page)
        const isPublicPath = pathname === "/login" || pathname === "/signup";

        // If we are on public path and not loading, we technically should render, 
        // but the effect might redirect logged in users.
        // Simplifying: Just show loader until decision is made.

        return (
            <div className="h-screen w-full flex items-center justify-center bg-black text-white">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
