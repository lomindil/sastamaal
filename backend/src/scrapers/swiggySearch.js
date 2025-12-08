module.exports = async function search(page, { podId, query }) {
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );

    await page.goto("https://www.swiggy.com/instamart", { waitUntil: "networkidle2" });

    await page.waitForFunction(() => window.App && window.App.deviceId, { timeout: 15000 }).catch(() => {});

    const session = await page.evaluate(() => {
        const cookies = document.cookie.split(";").reduce((acc, kv) => {
            const [k, v] = kv.split("=");
            if (k) acc[k.trim()] = (v || "").trim();
            return acc;
        }, {});
        return {
            tid: cookies.tid || "",
            sid: cookies.sid || "",
            deviceId: window.App?.deviceId || "",
            appVersion: window.App?.buildVersion || ""
        };
    });

    const url = `https://www.swiggy.com/api/instamart/search/v2?offset=0&ageConsent=false&storeId=${podId}&primaryStoreId=${podId}`;

    const body = {
        facets: [],
        sortAttribute: "",
        query,
        search_results_offset: "0",
        page_type: "INSTAMART_AUTO_SUGGEST_PAGE",
        is_pre_search_tag: false
    };

    const responseText = await page.evaluate(async (url, body, session) => {
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*",
            "x-client-id": "INSTAMART-APP",
            "x-platform": "web",
            "x-tid": session.tid,
            "x-device-id": session.deviceId,
            "x-app-version": session.appVersion,
            "Referer": "https://www.swiggy.com/instamart",
            "Origin": "https://www.swiggy.com"
        };
        return await (await fetch(url, { method: "POST", headers, body: JSON.stringify(body), credentials: "include" })).text();
    }, url, body, session);

    const json = JSON.parse(responseText);

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
