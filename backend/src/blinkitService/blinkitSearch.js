import fs from "fs";
import { getLocationInfo } from "./blinkitLocation.js";
import { runBlinkitSearch } from "./blinkitBrowser.js";
import { parseResponse } from "./helpers.js";

const blinkitSearch = async (location, query) => {
  const locationInfo = await getLocationInfo(location);

  const result = await runBlinkitSearch({
    location: locationInfo,
    query
  });
  console.log(result);

  const finalResult = parseResponse(result.searchResponse);

  fs.writeFileSync(
    "blinkit_flow.json",
    JSON.stringify(finalResult, null, 2)
  );

  console.log("✅ Location & Query injected → correct prices received");

  return finalResult;
};

await blinkitSearch("AECS Layout", "orange juice");
