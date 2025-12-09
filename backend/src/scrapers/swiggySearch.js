module.exports = async function search(page, { podId, query }) {
    

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        );

        console.log("Visiting Instamart...");
        await page.goto("https://www.swiggy.com/instamart", {
            waitUntil: "networkidle2",
			credentials: "include",
            timeout: 30000
        });

    console.log("Waiting for Instamart app initialization...");
    await page.waitForFunction(() => window.App && window.App.deviceId, { timeout: 15000 });
    const url = `https://www.swiggy.com/api/instamart/search/v2?offset=0&ageConsent=false&voiceSearchTrackingId=&storeId=${podId}&primaryStoreId=${podId}`;

    const payload = {
      facets: [],
      sortAttribute: "",
      query,                    // <--- change the search term here
      search_results_offset: "0",
      page_type: "INSTAMART_AUTO_SUGGEST_PAGE",
      is_pre_search_tag: false
    };

            const responseData = await page.evaluate(async (payload,url) => {
            const headers = {
                "Content-Type": "application/json",
                "x-client-id": "INSTAMART-APP",
                "x-platform": "web",
                "Accept": "application/json, text/plain, */*"
            };

            const res = await fetch(
                url,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                    credentials: "include"
                }
            );

            const text = await res.text();

            return {
                status: res.status,
                body: text
            };
        }, payload, url);

    if (responseData.status !== 200) {
        console.error("Swiggy API Request Failed:", responseData.status, "Response Text:", responseData.text);
        // Throw an error or return an empty array if the API call failed
        throw new Error(`API call failed with status ${responseData.status}. Response: ${responseData.text}`);
    }

    const fs = require("fs");
    const path = require("path");

    // Save full raw response for debugging
    const logFile = path.join(__dirname, "../../logs", `swiggy_search_${Date.now()}.json`);
    fs.writeFileSync(logFile, responseData.body, "utf8");

    console.log("Saved raw Swiggy search JSON ->", logFile);
    const json = JSON.parse(responseData.body);

    const items = [];
    function collect(obj) {
        if (!obj) return;
        if (Array.isArray(obj.items)) items.push(...obj.items);
        if (typeof obj === "object") for (const k of Object.keys(obj)) collect(obj[k]);
    }
    collect(json);

    return items.map(it => ({
        name: it.displayName || it.name || "",
        brand: it.brandName || it.brand || "",
        sku: it.variations?.[0]?.skuId || "",
        price: it.variations?.[0]?.price?.offerPrice?.units || null,
        podId: it.podId || ""
    }));
};
