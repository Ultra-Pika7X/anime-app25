
const { scraper } = require('../src/lib/scraper');
// Mocking axios/cheerio might be needed if running in pure node without build, 
// but since we are using ts-node and the project has tsconfig, we should try running it directly.
// However, the imports in src/lib/scraper use aliases like @/lib/... which might fail in ts-node without tsconfig-paths.
// I will use relative paths in the script or assume ts-node uses tsconfig.json.

// Actually, to avoid path alias issues, it is often easier to copy the relevant logic or just assume the user runs it with proper setup.
// Let's try to make a script that imports from the relative paths if possible, or use the `tsconfig-paths` register.

// Better approach: Test Gogoanime and HiAnime classes directly if possible, or Scraper.
// I will try to use the classes directly to isolate them.

import { Gogoanime } from '../src/lib/Gogoanime';
import { HiAnime } from '../src/lib/HiAnime';

async function testSources() {
    console.log("Starting Source Verification...");

    const gogo = new Gogoanime();
    const hianime = new HiAnime();

    const query = "One Piece";

    // 1. Test Gogoanime
    try {
        console.log("\n[Gogoanime] Searching...");
        const search = await gogo.search(query);
        if (search.results.length > 0) {
            console.log(`[Gogoanime] Found ${search.results.length} results. Top: ${search.results[0].title}`);
            const animeId = search.results[0].id;

            console.log(`[Gogoanime] Fetching info for ${animeId}...`);
            const info = await gogo.fetchAnimeInfo(animeId);

            if (info && info.episodes.length > 0) {
                const ep = info.episodes[0];
                console.log(`[Gogoanime] Fetching sources for Episode ${ep.number}...`);
                const sources = await gogo.fetchEpisodeSources(ep.id);
                console.log(`[Gogoanime] Sources found: ${sources.sources.length}`);
                sources.sources.forEach(s => console.log(`  - ${s.quality}: ${s.url}`));
            } else {
                console.log("[Gogoanime] No episodes found.");
            }
        } else {
            console.log("[Gogoanime] No results found.");
        }
    } catch (e) {
        console.error("[Gogoanime] Failed:", e.message);
    }

    // 2. Test HiAnime
    try {
        console.log("\n[HiAnime] Searching...");
        const search = await hianime.search(query);
        if (search.results.length > 0) {
            console.log(`[HiAnime] Found ${search.results.length} results. Top: ${search.results[0].title}`);
            const animeId = search.results[0].id;

            console.log(`[HiAnime] Fetching info for ${animeId}...`);
            const info = await hianime.fetchAnimeInfo(animeId);

            if (info && info.episodes.length > 0) {
                const ep = info.episodes[0]; // First episode
                console.log(`[HiAnime] Fetching sources for Episode ${ep.number} (ID: ${ep.id})...`);
                const sources = await hianime.fetchEpisodeSources(ep.id);
                console.log(`[HiAnime] Sources found: ${sources.sources.length}`);
                sources.sources.forEach(s => console.log(`  - ${s.quality}: ${s.url}`));
            } else {
                console.log("[HiAnime] No episodes found.");
            }
        } else {
            console.log("[HiAnime] No results found.");
        }
    } catch (e) {
        console.error("[HiAnime] Failed:", e.message);
    }
}

testSources();
