import puppeteer from "puppeteer";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const runBlinkitSearch = async ({ location, query }) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  const page = await browser.newPage();

  let authKeyResponse = null;
  let searchResponse = null;
  const encodedQuery = encodeURIComponent(query);

  page.on("response", async (res) => {
    const url = res.url();

    if (url.includes("/v2/accounts/auth_key/")) {
      authKeyResponse = await res.json();
    }

    if (url.includes(`/v1/layout/search?q=${encodedQuery}`)) {
      searchResponse = await res.json();
    }
  });

  await page.goto("https://blinkit.com", { waitUntil: "networkidle2" });
  await sleep(2000);

  await page.setCookie(
    {
      name: "gr_1_lat",
      value: String(location.lat),
      domain: ".blinkit.com",
      path: "/"
    },
    {
      name: "gr_1_lon",
      value: String(location.lon),
      domain: ".blinkit.com",
      path: "/"
    },
    {
      name: "gr_1_locality",
      value: location.locality,
      domain: ".blinkit.com",
      path: "/"
    },
    {
      name: "gr_1_landmark",
      value: encodeURIComponent(location.landmark),
      domain: ".blinkit.com",
      path: "/"
    }
  );

  await page.setExtraHTTPHeaders({
    device_id: "e82cd375p8f70301",
    Lat: String(location.lat),
    Lon: String(location.lon)
  });

  await page.goto(
    `https://blinkit.com/s/?q=${encodedQuery}`,
    { waitUntil: "networkidle2" }
  );

  await sleep(3000);

  const cookies = await page.cookies();

  await browser.close();

  return {
    authKeyResponse,
    searchResponse,
    cookies
  };
};
