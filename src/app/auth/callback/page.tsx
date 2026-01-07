"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        // AniList Implicit Grant returns token in the URL fragment (hash)
        // Format: #access_token={TOKEN}&token_type=Bearer&expires_in={EXPIRY}
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");

        if (accessToken) {
            login(accessToken)
                .then(() => {
                    router.push("/");
                })
                .catch((err: any) => {
                    console.error("Login failed during callback:", err);
                    router.push("/?error=login_failed");
                });
        } else {
            // If no token in hash, maybe it's in query? (Auth Code flow uses query, Implicit uses hash)
            // Fallback to check query just in case, though we used response_type=token
            const searchParams = new URLSearchParams(window.location.search);
            const code = searchParams.get("code");
            if (code) {
                console.error("Auth Code flow not implemented, expected Implicit Grant.");
                router.push("/?error=wrong_flow");
            } else {
                // No token found
                // setTimeout(() => router.push("/"), 2000);
            }
        }
    }, [login, router]);

    return (
        <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Authenticating with AniList...</p>
        </div>
    );
}
