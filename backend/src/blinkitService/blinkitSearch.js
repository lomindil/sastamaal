const { runBlinkitSearch } = require("./blinkitBrowser");
const { parseResponse } = require("./helpers");

const blinkitSearch = async (location, query) => {
    const locationInfo = location;
    console.log("Location:", locationInfo);
    console.log("Query:", query);
    
    const result = await runBlinkitSearch({
        location: locationInfo,
        query,
    });

    console.log("Result Generated!!!");
    const finalResult = parseResponse(result.searchResponse);
    // console.log(finalResult);

    console.log("✅ Location & Query injected → correct prices received");
    return finalResult;
};

module.exports = {
    blinkitSearch,
};
