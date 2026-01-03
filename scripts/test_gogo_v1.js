
const { ANIME } = require('@consumet/extensions');

async function testGogo() {
    console.log("Testing Gogoanime (1.6.0) with Naruto...");
    try {
        const gogo = new ANIME.Gogoanime();
        const results = await gogo.search("Naruto");
        console.log("Results:", results.results.length);
        if (results.results.length > 0) {
            console.log("Found:", results.results[0].title);
            const info = await gogo.fetchAnimeInfo(results.results[0].id);
            console.log("Episodes:", info.episodes.length);
            if (info.episodes.length > 0) {
                const sources = await gogo.fetchEpisodeSources(info.episodes[0].id);
                console.log("Sources:", sources.sources.length);
            }
        }
    } catch (e) {
        console.error("Gogo Failed:", e);
    }
}
testGogo();
