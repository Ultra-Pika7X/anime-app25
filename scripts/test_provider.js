
const { ANIME } = require('@consumet/extensions');

async function testProviders() {
    console.log("Testing AnimePahe...");
    const pahe = new ANIME.AnimePahe();
    try {
        const results = await pahe.search("Solo Leveling");
        if (results.results.length > 0) {
            console.log("Pahe Search: Found", results.results[0].title);
            const info = await pahe.fetchAnimeInfo(results.results[0].id);
            console.log("Pahe Info: Episodes", info.episodes?.length);
            if (info.episodes?.length > 0) {
                const sources = await pahe.fetchEpisodeSources(info.episodes[0].id);
                console.log("Pahe Sources:", sources.sources?.length);
            }
        }
    } catch (e) {
        console.error("AnimePahe Failed:", e.message);
    }

    console.log("\nTesting Gogoanime...");
    const gogo = new ANIME.Gogoanime();
    try {
        const results = await gogo.search("Solo Leveling");
        if (results.results.length > 0) {
            console.log("Gogo Search: Found", results.results[0].title);
            const info = await gogo.fetchAnimeInfo(results.results[0].id);
            console.log("Gogo Info: Episodes", info.episodes?.length);
            if (info.episodes?.length > 0) {
                const sources = await gogo.fetchEpisodeSources(info.episodes[0].id);
                console.log("Gogo Sources:", sources.sources?.length);
            }
        }
    } catch (e) {
        console.error("Gogoanime Failed:", e.message);
    }
}

testProviders();
