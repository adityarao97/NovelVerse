// Test script to debug TMDB API
// Run with: node --experimental-strip-types test-tmdb.ts

const TMDB_API_KEY = "0b019d01ad0cbd9dbebebbab1692904c";
const TMDB_BASE = "https://api.themoviedb.org/3";

async function testTMDB() {
    // Test 1: Search for an anime
    console.log("\n=== Test 1: Searching for 'Frieren' ===");
    const searchUrl = `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=Frieren&language=en-US`;

    try {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchResponse.ok) {
            console.log("✅ Search successful!");
        console.log(`Found ${searchData.results?.length || 0} results`);

        if (searchData.results && searchData.results.length > 0) {
            const firstResult = searchData.results[0];
            console.log(`\nFirst match: ${firstResult.name} (ID: ${firstResult.id})`);

            // Test 2: Get episodes for Season 1
            console.log(`\n=== Test 2: Getting Season 1 episodes for ID ${firstResult.id} ===`);
            const seasonUrl = `${TMDB_BASE}/tv/${firstResult.id}/season/1?api_key=${TMDB_API_KEY}&language=en-US`;

            const seasonRes = await fetch(seasonUrl);
            const seasonData = await seasonRes.json();

            if (seasonRes.ok) {
                console.log(`✅ Got ${seasonData.episodes?.length || 0} episodes for Season 1`);

                if (seasonData.episodes && seasonData.episodes.length > 0) {
                    const ep1 = seasonData.episodes[0];
                    console.log(`\nEpisode 1: ${ep1.name}`);
                    console.log(`  - Image: ${ep1.still_path ? '✅ Yes' : '❌ No'}`);
                    console.log(`  - Still path: ${ep1.still_path || 'None'}`);
                    if (ep1.still_path) {
                        console.log(`  - Full URL: https://image.tmdb.org/t/p/w300${ep1.still_path}`);
                    }
                }
            } else {
                console.log(`❌ Season fetch failed: ${seasonRes.status}`);
                console.log(JSON.stringify(seasonData, null, 2));
            }
        }
    } else {
        console.log(`❌ Search failed: ${searchRes.status}`);
        console.log(JSON.stringify(searchData, null, 2));
    }
} catch (error) {
    console.error("❌ Error:", error);
}
}

testTMDB();
