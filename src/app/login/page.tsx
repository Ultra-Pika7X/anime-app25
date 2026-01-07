"use client";

import React, { useState } from "react";
import Link from "next/link";
import { anilist } from "@/lib/anilist";
import { AnilistLogin } from "@/components/auth/AnilistLogin";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
            <div className="relative w-full max-w-md">
                {/* Background Glow */}
                <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-primary/50 to-purple-600/50 opacity-20 blur-2xl transition duration-1000 group-hover:opacity-40" />

                <div className="relative flex flex-col gap-8 rounded-[2rem] border border-white/10 bg-black/40 p-8 backdrop-blur-2xl shadow-2xl md:p-10">
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-3xl font-black tracking-tighter text-white md:text-4xl">
                            Welcome Back
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            Log in with your AniList account to sync your progress.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-center w-full">
                            <AnilistLogin />
                        </div>
                    </div>

                    <div className="text-center text-sm font-medium text-muted-foreground mt-4">
                        Don&apos;t have an AniList account?{" "}
                        <Link href="https://anilist.co/signup" target="_blank" className="font-bold text-white hover:text-primary transition-colors">
                            Sign up on AniList
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
