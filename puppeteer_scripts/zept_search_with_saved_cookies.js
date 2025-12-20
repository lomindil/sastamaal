import puppeteer from "puppeteer";
import fs from "fs";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function searchWithSavedCookies(query) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/122.0.0.0 Safari/537.36"
  );

  // Load cookies
  const cookies = JSON.parse(
    fs.readFileSync("zepto_cookies.json", "utf-8")
  );

  await page.setCookie(...cookies);
  console.log("🍪 Cookies restored");

  let searchApiResponse = null;

  page.on("response", async (res) => {
    if (
      res.url().includes("/api/v3/search")
 &&
      res.request().method() === "POST"
    ) {
      searchApiResponse = await res.json();
      console.log("✅ Search API captured");
    }
  });

  console.log("🔍 Opening search page...");
  await page.goto(
    `https://www.zepto.com/search?query=${encodeURIComponent(query)}`,
    {
      waitUntil: "networkidle2",
      timeout: 60000
    }
  );

  await sleep(4000);

  if (!searchApiResponse) {
    console.log("❌ Search API not captured");
  } else {
    fs.writeFileSync(
      "zepto_search_with_cookies.json",
      JSON.stringify(searchApiResponse, null, 2)
    );
    console.log("✅ zepto_search_with_cookies.json saved");
  }

  await browser.close();
}

searchWithSavedCookies("potato");
