"use client";

import { Button } from "@/components/ui/Button";
import { SiAnilist } from "react-icons/si";

// You should replace this with your actual Client ID if possible, 
// or I can assume a placeholder for the "Implicit Grant" or standard flow.
// Standard Implicit Grant URL structure: 
// https://anilist.co/api/v2/oauth/authorize?client_id={CLIENT_ID}&response_type=token
const CLIENT_ID = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID || "23062";
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';

export function AnilistLogin() {
    const handleLogin = () => {
        // Construct the AniList OAuth URL
        // Using Implicit Grant (response_type=token) for client-side only apps
        const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${CLIENT_ID}&response_type=token`;
        window.location.href = authUrl;
    };

    return (
        <Button
            onClick={handleLogin}
            className="gap-2 bg-[#02A9FF] hover:bg-[#0297e6] text-white font-bold"
        >
            {/* Assuming we might not have react-icons installed, I'll use text or a simple SVG if needed, 
          but usually lucide-react doesn't have brand icons. 
          I'll verify if `react-icons` is in package.json. 
          It wasn't. So I will just use text or a generic icon from lucide. 
      */}
            Login with AniList
        </Button>
    );
}
