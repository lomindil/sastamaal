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

        // const fs = require("fs");
        // const path = require("path");

        // // Save full raw response for debugging
        // const logFile = path.join(__dirname, "../../logs", `swiggy_search_${Date.now()}.json`);
        // fs.writeFileSync(logFile, responseData.body, "utf8");

        //console.log("Saved raw Swiggy search JSON ->", logFile);
        const json = JSON.parse(responseData.body);

        const items = [];
        function collect(obj) {
            if (!obj) return;
            if (Array.isArray(obj.items)) items.push(...obj.items);
            if (typeof obj === "object") for (const k of Object.keys(obj)) collect(obj[k]);
        }
        collect(json);

        function extractImageUrls(it) {
            const variation = (it.variations && it.variations[0]) || {};

            const possibleImages = [];

            // 1. New Instamart-style array
            if (Array.isArray(variation.imageIds)) {
             possibleImages.push(...variation.imageIds);
            }

            if (Array.isArray(it.imageIds)) {
                possibleImages.push(...it.imageIds);
            }

            // 2. Short imageId fields
            if (it.imageId) possibleImages.push(it.imageId);
            if (variation.imageId) possibleImages.push(variation.imageId);

            // Normalize into full CDN URLs
            return possibleImages.map(id =>
                `https://media-assets.swiggy.com/swiggy/image/upload/${id}`
                );
            }

        // normalize single item into unified schema
        function normalizeItem(it) {
            const variation = (it.variations && it.variations[0]) || {};
            const mrp = variation.price?.mrp?.units ?? (variation.price?.mrp ?? null);
            const offer = variation.price?.offerPrice?.units ?? (variation.price?.offerPrice ?? null);

            const price = mrp !== null ? String(mrp) : null;
            const offerPrice = offer !== null ? String(offer) : null;
            const discount = mrp && offer ? (Number(mrp) - Number(offer)) : null;

            return {
                name: it.displayName || it.name || "",
                description: it.shortDescription || it.description || "",
                quantity: variation.quantityDescription || variation.displayQuantity || "",
                price: price,
                offerPrice: offerPrice,
                discount: discount,
                images: extractImageUrls(it)  
            };
        }


    // normalize items
    const normalized = items.map(normalizeItem);
    return normalized;
};
