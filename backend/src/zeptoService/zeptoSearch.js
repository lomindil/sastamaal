const { runZeptoSearch } = require("./zeptoBrowser.js");
const { parseResponse } = require("./helpers.js")

const zeptoSearchItems = async (location, query) => {
    const locationInfo = location;
    console.log("Location:", locationInfo);
    console.log("Query:", query);

    const result = await runZeptoSearch({
        location: locationInfo,
        query,
    });

    console.log("Result Generated!!!");
    if (!result) {
        console.log("❌ No result returned from Zepto");
        return null;
    }

    const finalResult = parseResponse(result.searchResponse);

    console.log("✅ Location & Query injected → correct prices received");
    return finalResult;
};

module.exports = {
    zeptoSearchItems,
};


// 🔥 TEST CALL (same script)
(async () => {
    const location = {
        latitude: 12.966106132790609,
        longitude: 77.71661152444409
    };

    const query = "milk";

    console.log("🚀 Starting Zepto test...");
    const data = await zeptoSearchItems(location, query);

    console.log("🧾 FINAL OUTPUT:");
    console.dir(data, { depth: null });
})();
