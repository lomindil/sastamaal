const { blockUnwantedResources } = require("../helpers/blockResources");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const runBlinkitSearch = async (browserIncognitoContext, location, query) => {
    let page;
    try {
        page = await browserIncognitoContext.newPage();
        await blockUnwantedResources(page);

        let searchResponse = null;
        const encodedQuery = encodeURIComponent(query);

        page.on("response", async (res) => {
            try {
                const url = res.url();

                if (
                    url.includes("/v1/layout/search") &&
                    url.includes(`q=${encodedQuery}`)
                ) {
                    console.log("🔍 Blinkit search API captured");
                    searchResponse = await res.json();
                }
            } catch (err) {
                console.error("❌ Error parsing Blinkit response:", err.message);
            }
        });

        await page.setCookie(
            {
                name: "gr_1_lat",
                value: String(location.lat),
                domain: ".blinkit.com",
                path: "/",
            },
            {
                name: "gr_1_lon",
                value: String(location.lon),
                domain: ".blinkit.com",
                path: "/",
            }
        );

        await page.setExtraHTTPHeaders({
            device_id: "e82cd375p8f70301",
            Lat: String(location.lat),
            Lon: String(location.lon),
        });

        await page.goto(
            `https://blinkit.com/s/?q=${encodedQuery}`,
            { waitUntil: "domcontentloaded", timeout: 60000 }
        );

        // ✅ WAIT like Zepto
        const start = Date.now();
        while (!searchResponse && Date.now() - start < 15000) {
            await sleep(300);
        }

        if (!searchResponse) {
            console.log("❌ Blinkit search API not captured");
            return null;
        }

        return { searchResponse };

    } catch (error) {
        console.error("❌ Blinkit search failed:", error.message);
        return null;
    } finally {
        if (page) {
            page.removeAllListeners("response"); // 🔐 critical
            await page.close();
        }
    }
};

module.exports = {
    runBlinkitSearch
};
