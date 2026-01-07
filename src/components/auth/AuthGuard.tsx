"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { firebaseUser, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            // Updated Logic: Mandatory Firebase Auth
            // 1. If not logged in (firebaseUser is null) -> Block everything except /login and /signup
            // 2. If logged in -> Block /login and /signup (redirect to home)

            const isPublicRoute = pathname === "/login" || pathname === "/signup";

            if (!firebaseUser && !isPublicRoute) {
                // Not authenticated -> Redirect to login
                router.push("/login");
            } else if (firebaseUser && isPublicRoute) {
                // Authenticated but on auth page -> Redirect to home
                router.push("/");
            } else {
                // Authorized
                setIsAuthorized(true);
            }
        }
    }, [firebaseUser, loading, pathname, router]);

    // Show loading while checking auth state or while redirecting
    if (loading || !isAuthorized) {
        // Allow public routes to render if we are just waiting for authorization flag but not loading?
        // No, avoid flash. Keep blocked until isAuthorized=true.

        // Exception: If we are on public route and loading=false but isAuthorized=false (waiting for effect),
        // we might want to show content? Effect runs fast.

        return (
            <div className="h-screen w-full flex items-center justify-center bg-black text-white">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
