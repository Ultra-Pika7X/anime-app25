import { Navbar } from "@/components/common/Navbar";
import { Sidebar } from "@/components/common/Sidebar";

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
        <Sidebar />
        <Navbar />
        <div className="flex-1 lg:pl-20 transition-all duration-300">
          <main className="min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
