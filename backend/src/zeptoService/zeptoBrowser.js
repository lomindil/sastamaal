const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const runZeptoSearch = async (browser, location, query) => {
    let page;
    try {
        page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/122.0.0.0 Safari/537.36"
        );

        let searchApiResponse = null;
        page.on("response", async (response) => {
            try {
                const request = response.request();
                const url = response.url();

                if (
                    url.endsWith("/api/v3/search") &&
                    request.method() === "POST"
                ) {
                    const postData = request.postData();
                    if (!postData) return;

                    const body = JSON.parse(postData);
                    if (!body?.query || body.query !== query) return;

                    console.log("✅ REAL PRODUCT SEARCH CAPTURED");
                    console.log("🔍 Query:", body.query);

                    searchApiResponse = await response.json();
                }
            } catch (err) {
                console.log(err);
            }
        });

        console.log("🌐 Opening Zepto homepage...");
        await page.goto("https://www.zepto.com/", {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

        await sleep(1000);

        await page.setCookie(
            {
                name: "latitude",
                value: String(location.lat),
                domain: ".zepto.com",
                path: "/",
                secure: true,
                sameSite: "Lax"
            },
            {
                name: "longitude",
                value: String(location.lon),
                domain: ".zepto.com",
                path: "/",
                secure: true,
                sameSite: "Lax"
            },
            {
                name: "user_position",
                value: JSON.stringify({
                    lat: location.lat,
                    lon: location.lon
                }),
                domain: ".zepto.com",
                path: "/",
                secure: true,
                sameSite: "Lax"
            }
        );

        await page.reload({
            waitUntil: "networkidle2",
            timeout: 60000
        });

        await sleep(1000);
        await page.goto(
        `https://www.zepto.com/search?query=${encodeURIComponent(query)}`,
        {
            waitUntil: "networkidle2",
            timeout: 60000
        });

        const start = Date.now();
        while (!searchApiResponse && Date.now() - start < 15000) {
            await sleep(300);
        }

        if (!searchApiResponse) {
        console.log("❌ Search API response not captured");
            return null;
        }

        return { 
            searchApiResponse
        };

    } catch (err) {
        console.error("❌ Zepto search failed:", err.message);
        return null;
    } finally {
        if (page) {
            page.removeAllListeners("response");
            await page.close();
        }
    }
};

module.exports = {
    runZeptoSearch
};
