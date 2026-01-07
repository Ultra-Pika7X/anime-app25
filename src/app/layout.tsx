import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/layout/Shell";
import { AuthProvider } from "@/context/AuthContext";
import { LibraryProvider } from "@/context/LibraryContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import AuthGuard from "@/components/auth/AuthGuard";
import { CacheInit } from "@/components/common/CacheInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CloudAnime",
  description: "The ultimate unlimited streaming experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans halo`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LibraryProvider>
              <AuthGuard>
                <Shell>
                  {children}
                </Shell>
              </AuthGuard>
            </LibraryProvider>
          </AuthProvider>
          <CacheInit />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
