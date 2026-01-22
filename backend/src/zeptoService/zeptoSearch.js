const { runZeptoSearch } = require("./zeptoBrowser.js");
const { parseResponse } = require("./helpers.js");
const {
    acquireStealthContext,
    releaseStealthContext
} = require("../helpers/browser");

const zeptoSearchItems = async (location, query) => {
    console.log("Location:", location);
    console.log("Query:", query);

    const context = await acquireStealthContext();
    try {
        const result = await runZeptoSearch(context, location, query);
        if (!result) {
            throw new Error("Search response not received");
        }
        console.log("Location & Query injected → correct prices received");

        return parseResponse(result.searchApiResponse);

    } finally {
        releaseStealthContext(context);
    }
};

module.exports = {
    zeptoSearchItems,
};



// // 🔥 TEST CALL (same script)
// if (require.main === module) {
//     (async () => {
//         const location = {
//             lat: "28.4646148",
//             lon: "77.0299194",
//             address: "Gurgaon, Haryana, India"
//         };
//         const browser = await getBrowser();
//         await zeptoSearchItems(browser, location, "potato");
//         await closeBrowser();
//     })();
// }
