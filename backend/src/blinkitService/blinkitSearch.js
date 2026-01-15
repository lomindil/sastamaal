const { runBlinkitSearch } = require("./blinkitBrowser");
const { parseResponse } = require("./helpers");
const { getBrowser, closeBrowser } = require("../helpers/browser");

const blinkitSearch = async (browserIncognitoContext, location, query) => {
    console.log("Location:", location);
    console.log("Query:", query);
    
    const result = await runBlinkitSearch(browserIncognitoContext, location, query);
    console.log("Result Generated!!!");

    if (!result || !result.searchResponse) {
        throw new Error("Search response not received");
    }

    const finalResult = parseResponse(result.searchResponse);

    console.log("Location & Query injected → correct prices received");
    return finalResult;
};


module.exports = {
    blinkitSearch,
};






// Call the function
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