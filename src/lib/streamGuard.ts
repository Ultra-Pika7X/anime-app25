export class StreamGuard {
    private static readonly BLOCKED_DOMAINS = [
        'ad.', 'ads.', 'doubleclick', 'google-analytics', 'facebook', 'tracker',
        'pop', 'popup', 'beacons', 'pixel', 'analytics', 'mc.yandex'
    ];

    private static readonly BLOCKED_EXTENSIONS = [
        '.exe', '.zip', '.rar', '.apk', '.bat', '.cmd', '.sh'
    ];

    static validate(url: string, isM3U8: boolean = false): { valid: boolean; reason?: string } {
        if (!url) return { valid: false, reason: "Empty URL" };

        try {
            const urlObj = new URL(url);

            // 1. Protocol Check
            if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
                return { valid: false, reason: "Invalid Protocol" };
            }

            // 2. Domain Blocklist
            const domain = urlObj.hostname.toLowerCase();
            if (this.BLOCKED_DOMAINS.some(d => domain.includes(d))) {
                return { valid: false, reason: "Blocked Domain" };
            }

            // 3. Extension Check (if not m3u8)
            if (!isM3U8) {
                if (this.BLOCKED_EXTENSIONS.some(ext => urlObj.pathname.toLowerCase().endsWith(ext))) {
                    return { valid: false, reason: "Blocked File Type" };
                }
            }

            // 4. M3U8 Specific Checks
            if (isM3U8) {
                if (!url.includes('.m3u8')) {
                    // Not necessarily failure, but warning. 
                    // Some providers hide extensions. We'll trust the flag but verify protocol.
                }
            }

            return { valid: true };

        } catch (e) {
            return { valid: false, reason: "Malformed URL" };
        }
    }
}
