
const { ANIME } = require('@consumet/extensions');

async function testHianime() {
    console.log("Testing Hianime...");
    const hianime = new ANIME.Hianime();
    try {
        const query = "Solo Leveling";
        console.log(`Searching for: ${query}`);

        const results = await hianime.search(query);
        if (results.results.length > 0) {
            const best = results.results[0];
            console.log("Found:", best.title, "ID:", best.id);

            const info = await hianime.fetchAnimeInfo(best.id);
            console.log("Info Title:", info.title);
            console.log("Episodes:", info.episodes?.length);

            if (info.episodes?.length > 0) {
                const epId = info.episodes[0].id; // usually string
                console.log("Fetching sources for epId:", epId);
                const sources = await hianime.fetchEpisodeSources(epId);
                console.log("Sources:", sources.sources?.length);
                console.log("First Source:", sources.sources?.[0]?.url);
            } else {
                console.log("No episodes found in info.");
            }
        } else {
            console.log("No search results.");
        }
    } catch (e) {
        console.error("Hianime Failed:", e);
    }
}

testHianime();
