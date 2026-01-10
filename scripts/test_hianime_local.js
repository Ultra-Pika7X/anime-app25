
const { HiAnime } = require('./src/lib/HiAnime');
// This is a TS file, so I might need ts-node or run it via a temporary JS version
// Since I can't easily run TS directly without setup, I'll just check the logic or use a dummy JS test.
async function test() {
    const hianime = new HiAnime();
    console.log("Searching for Naruto...");
    const res = await hianime.search("Naruto");
    console.log("Found:", res.results.length);
    if (res.results.length > 0) {
        console.log("First result:", res.results[0].title);
    }
}
// test();
