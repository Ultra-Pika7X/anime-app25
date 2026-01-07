"use client";

import { useEffect, useCallback } from "react";

type KeyHandler = () => void;

interface ShortcutHandlers {
    togglePlay?: KeyHandler;
    toggleMute?: KeyHandler;
    toggleFullscreen?: KeyHandler;
    seekForward?: KeyHandler;
    seekBackward?: KeyHandler;
    volumeUp?: KeyHandler;
    volumeDown?: KeyHandler;
    nextEpisode?: KeyHandler;
    previousEpisode?: KeyHandler;
    skipIntro?: KeyHandler;
    skipOutro?: KeyHandler;
}

/**
 * Hook for keyboard shortcuts in the video player.
 * Provides standard video player bindings.
 */
export function useKeyboardShortcuts(
    handlers: ShortcutHandlers,
    enabled: boolean = true
) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Ignore if typing in an input
            const target = event.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
                return;
            }

            switch (event.key.toLowerCase()) {
                case " ":
                case "k":
                    event.preventDefault();
                    handlers.togglePlay?.();
                    break;

                case "m":
                    event.preventDefault();
                    handlers.toggleMute?.();
                    break;

                case "f":
                    event.preventDefault();
                    handlers.toggleFullscreen?.();
                    break;

                case "arrowright":
                case "l":
                    event.preventDefault();
                    handlers.seekForward?.();
                    break;

                case "arrowleft":
                case "j":
                    event.preventDefault();
                    handlers.seekBackward?.();
                    break;

                case "arrowup":
                    event.preventDefault();
                    handlers.volumeUp?.();
                    break;

                case "arrowdown":
                    event.preventDefault();
                    handlers.volumeDown?.();
                    break;

                case "n":
                    if (event.shiftKey) {
                        event.preventDefault();
                        handlers.nextEpisode?.();
                    }
                    break;

                case "p":
                    if (event.shiftKey) {
                        event.preventDefault();
                        handlers.previousEpisode?.();
                    }
                    break;

                case "s":
                    event.preventDefault();
                    handlers.skipIntro?.();
                    break;

                case "e":
                    event.preventDefault();
                    handlers.skipOutro?.();
                    break;
            }
        },
        [handlers, enabled]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown, enabled]);
}
