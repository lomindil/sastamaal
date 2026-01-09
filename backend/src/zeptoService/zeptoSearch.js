const { runZeptoSearch } = require("./zeptoBrowser.js");
const { parseResponse } = require("./helpers.js");
const { getBrowser, closeBrowser } = require("../helpers/browser");

const zeptoSearchItems = async (browser, location, query) => {
    console.log("Location:", location);
    console.log("Query:", query);

    const result = await runZeptoSearch(browser, location, query);

    if (!result) {
        throw new Error("Search response not received");
    }

    const finalResult = parseResponse(result.searchApiResponse);

    console.log("Location & Query injected → correct prices received");
    console.log(finalResult);
    return finalResult;
};

module.exports = {
    zeptoSearchItems,
};




// 🔥 TEST CALL (same script)
if (require.main === module) {
    (async () => {
        const location = {
            lat: "28.4646148",
            lon: "77.0299194",
            address: "Gurgaon, Haryana, India"
        };

        const browser = await getBrowser();
        await zeptoSearchItems(browser, location, "potato");
        await closeBrowser();
    })();
}
