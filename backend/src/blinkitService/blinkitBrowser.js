const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const runBlinkitSearch = async (browserIncognitoContext, location, query) => {
    let page;
    try {
        page = await browserIncognitoContext.newPage();

        let authKeyResponse = null;
        let searchResponse = null;

        const encodedQuery = encodeURIComponent(query);

        page.on("response", async (res) => {
            try {
                const url = res.url();

                if (url.includes("/v2/accounts/auth_key/")) {
                    authKeyResponse = await res.json();
                    console.log("Auth key response received.");
                }

                if (url.includes(`/v1/layout/search?q=${encodedQuery}`)) {
                    searchResponse = await res.json();
                    console.log("Search response received.");
                }
            } catch (err) {
                console.error("Error parsing response JSON:", err);
            }
        });

        console.log("Navigating to Blinkit...");
        await page.goto("https://blinkit.com", {
            waitUntil: "domcontentloaded",
        });

        await sleep(1500);

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
            { waitUntil: "domcontentloaded" }
        );

        await sleep(1500);

        return {
            authKeyResponse,
            searchResponse,
        };
    } catch (error) {
        console.error("An error occurred:", error);
        throw error;
    } finally {
        if (page) {
            await page.close();
        }
    }
};

module.exports = {
    runBlinkitSearch
};
