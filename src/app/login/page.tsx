"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Failed to log in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

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
                            Log in to your account to continue streaming.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-white/70 ml-1">Email Address</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-bold text-white/70">Password</label>
                                <Link href="#" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 text-white placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-14 w-full rounded-2xl bg-primary text-lg font-bold shadow-[0_0_20px_rgba(97,82,223,0.3)] hover:shadow-[0_0_30px_rgba(97,82,223,0.5)] transition-all mt-2"
                        >
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    Log In <ArrowRight className="h-5 w-5" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm font-medium text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="font-bold text-white hover:text-primary transition-colors">
                            Sign up now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
