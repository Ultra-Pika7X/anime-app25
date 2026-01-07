"use client";

import { useDownloads } from "@/context/DownloadContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Trash, Play, DownloadCloud, AlertCircle, CheckCircle } from "lucide-react";

export default function DownloadsPage() {
    const { downloads, deleteDownload } = useDownloads();

    return (
        <div className="min-h-screen bg-black text-white p-8 mb-20">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <DownloadCloud className="text-purple-500" />
                Offline Library
            </h1>

            {downloads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
                    <DownloadCloud className="w-16 h-16 opacity-50" />
                    <p>No downloads yet. Go watch something!</p>
                    <Link href="/">
                        <Button>Browse Anime</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {downloads.map(item => (
                        <div key={item.id} className="bg-zinc-900 rounded-xl overflow-hidden shadow-lg border border-zinc-800 flex flex-col">
                            {/* Image Header */}
                            <div className="relative aspect-video">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    {item.status === 'completed' && (
                                        <Link href={`/watch/${item.animeId}/${item.episodeNumber}?offline=true`}>
                                            <Button variant="outline" className="rounded-full w-12 h-12 p-0">
                                                <Play className="fill-current ml-1" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                                <div className="absolute top-2 right-2">
                                    {item.status === 'completed' && <CheckCircle className="text-green-500" />}
                                    {item.status === 'downloading' && (
                                        <div className="bg-black/70 px-2 py-1 rounded text-xs font-mono">
                                            {Math.round(item.progress)}%
                                        </div>
                                    )}
                                    {item.status === 'error' && <AlertCircle className="text-red-500" />}
                                </div>
                            </div>

                            {/* Info Body */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold line-clamp-1">{item.title}</h3>
                                    <p className="text-sm text-gray-400">Episode {item.episodeNumber}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    {item.status === 'completed' ? (
                                        <Link href={`/watch/${item.animeId}/${item.episodeNumber}?offline=true`}>
                                            <Button size="sm" variant="outline" className="gap-2">
                                                <Play className="w-4 h-4" /> Watch
                                            </Button>
                                        </Link>
                                    ) : item.status === 'error' ? (
                                        <span className="text-red-500 text-xs">Failed</span>
                                    ) : (
                                        <span className="text-purple-500 text-xs">Downloading...</span>
                                    )}

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-red-500 hover:bg-red-500/10"
                                        onClick={() => deleteDownload(item.id)}
                                    >
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
