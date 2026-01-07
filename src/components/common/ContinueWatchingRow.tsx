"use client";

import { useLibrary } from "@/context/LibraryContext";
import { MediaRow } from "@/components/common/MediaRow";
import { useEffect, useState } from "react";

export function ContinueWatchingRow() {
    const { history } = useLibrary();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || history.length === 0) return null;

    return (
        <MediaRow
            title="Continue Watching"
            items={history}
        />
    );
}
