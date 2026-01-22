const { runBlinkitSearch } = require("./blinkitBrowser");
const { parseResponse } = require("./helpers");
const {
    acquireStealthContext,
    releaseStealthContext
} = require("../helpers/browser");

const blinkitSearch = async (location, query) => {
    console.log("Location:", location);
    console.log("Query:", query);

    const context = await acquireStealthContext();
    try {
        const result = await runBlinkitSearch(context, location, query);

        console.log("Result Generated!!!");
        if (!result || !result.searchResponse) {
            throw new Error("Search response not received");
        }

        console.log("Location & Query injected → correct prices received");
        return parseResponse(result.searchResponse);

    } finally {
        releaseStealthContext(context);
    }
};


module.exports = {
    blinkitSearch,
};




// // Call the function
// if (require.main === module) {
//     (async () => {
//         const location = {
//             lat: "28.4646148",
//             lon: "77.0299194",
//             address: "Gurgaon, Haryana, India"
//         };

//         const browser = await getBrowser();
//         await blinkitSearch(browser, location, "potato");
//         await closeBrowser();
//     })();
// }