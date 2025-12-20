module.exports = async function submitLocation(page, { lat, lng }) {
const BB_ALLOWED_COOKIES = new Set([
  "_bb_sa_ids",
  "_bb_cda_sa_info",
  "xentrycontext",
  "x-channel",
  "bb2_enabled",
  "_bb_bb2.0",
  "_is_bb1.0_supported",
  "is_integrated_sa",
  "isintegratedsa",
  "_bb_locSrc"
]);

function extractBigBasketLocationCookies(allCookies) {
  return allCookies.filter(c => BB_ALLOWED_COOKIES.has(c.name));
}

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );

  // Step 1: Initialize session
  await page.goto("https://www.bigbasket.com", {
    waitUntil: "networkidle2",
    timeout: 30000
  });

  // Step 2: Call serviceable API
  const url = `https://www.bigbasket.com/ui-svc/v1/serviceable/?lat=${lat}&lng=${lng}&send_all_serviceability=true`;

  const responseText = await page.evaluate(async (url) => {
    const res = await fetch(url, { credentials: "include" });
    return await res.text();
  }, url);

  let json;
  try {
    json = JSON.parse(responseText);
  } catch {
    return { success: false, reason: "invalid_json" };
  }

  const serviceable =
    json?.serviceable_ecs_info?.["bb-b2c"]?.serviceable;

  if (!serviceable) {
    return { success: false, reason: "not_serviceable" };
  }

  // Step 3: Extract cookies
  const cookies = await page.cookies();
  const locationCookies = extractBigBasketLocationCookies(cookies);
  console.log(locationCookies);
  return {
    success: true,
    locationCookies,
    placeInfo: json.places_info || null
  };
};
