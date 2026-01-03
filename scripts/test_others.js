
const { ANIME } = require('@consumet/extensions');

async function testOthers() {
    console.log("Testing KickAssAnime...");
    const kaa = new ANIME.KickAssAnime();
    try {
        const results = await kaa.search("Solo Leveling");
        if (results.results.length > 0) {
            console.log("KAA Found:", results.results[0].title);
            const info = await kaa.fetchAnimeInfo(results.results[0].id);
            if (info.episodes?.length > 0) {
                console.log("KAA Episodes:", info.episodes.length);
                const sources = await kaa.fetchEpisodeSources(info.episodes[0].id);
                console.log("KAA Sources:", sources.sources?.length);
            }
        }
    } catch (e) {
        console.error("KAA Failed:", e.message);
    }

    console.log("\nTesting AnimeKai...");
    const kai = new ANIME.AnimeKai();
    try {
        const results = await kai.search("Solo Leveling");
        if (results.results.length > 0) {
            console.log("Kai Found:", results.results[0].title);
            const info = await kai.fetchAnimeInfo(results.results[0].id);
            if (info.episodes?.length > 0) {
                console.log("Kai Episodes:", info.episodes.length);
                const sources = await kai.fetchEpisodeSources(info.episodes[0].id);
                console.log("Kai Sources:", sources.sources?.length);
            }
        }
    } catch (e) {
        console.error("Kai Failed:", e.message);
    }
}

testOthers();
