
import { AnimePahe } from '../src/lib/AnimePahe';

async function test() {
    console.log("Testing Custom AnimePahe...");
    const pahe = new AnimePahe();
    try {
        const results = await pahe.search("Solo Leveling");
        console.log("Search Results:", results.results.length);

        if (results.results.length > 0) {
            const best = results.results[0];
            console.log("Found:", best.title, "ID:", best.id);

            const info = await pahe.fetchAnimeInfo(best.id);
            console.log("Episodes:", info.episodes.length);

            if (info.episodes.length > 0) {
                const ep = info.episodes[0];
                console.log("Fetch sources for:", ep.id);
                const sources = await pahe.fetchEpisodeSources(ep.id);
                console.log("Sources:", sources.sources.length);
                console.log(sources.sources[0]);
            }
        }

    } catch (e) {
        console.error(e);
    }
}
test();
