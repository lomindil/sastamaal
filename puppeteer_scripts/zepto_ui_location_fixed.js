import puppeteer from "puppeteer";
import fs from "fs";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runZeptoSearch(query, addressText) {
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

  let searchApiResponse = null;

  page.on("response", async (res) => {
    try {
      if (
        res.url() === "https://api.zepto.com/api/v3/search" &&
        res.request().method() === "POST"
      ) {
        searchApiResponse = await res.json();
        console.log("✅ Search API captured");
      }
    } catch (_) {}
  });

  try {
    console.log("🌐 Opening Zepto...");
    await page.goto("https://www.zepto.com/", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    /* --------------------------------------------------
       1️⃣ Open address dialog
    -------------------------------------------------- */
    console.log("📍 Opening address dialog...");
    await page.waitForSelector(
      'h3[data-testid="user-address"]',
      { timeout: 20000 }
    );

    await page.evaluate(() => {
      document
        .querySelector('h3[data-testid="user-address"]')
        .closest("button")
        .click();
    });

    /* --------------------------------------------------
       2️⃣ Type address
    -------------------------------------------------- */
    await page.waitForSelector(
      'input[placeholder="Search a new address"]',
      { timeout: 20000 }
    );

    const input = await page.$(
      'input[placeholder="Search a new address"]'
    );

    console.log("⌨️ Typing address...");
    await input.click({ clickCount: 3 });
    await input.type(addressText, { delay: 80 });

    /* --------------------------------------------------
       3️⃣ Wait for REAL suggestions
    -------------------------------------------------- */
    console.log("⏳ Waiting for address suggestions...");
    await page.waitForSelector(
      'div[data-testid="address-search-item"]',
      { timeout: 20000 }
    );

    /* --------------------------------------------------
       4️⃣ Click FIRST suggestion
    -------------------------------------------------- */
    console.log("📌 Clicking first address suggestion...");
    await page.evaluate(() => {
      const firstItem = document.querySelector(
        'div[data-testid="address-search-item"]'
      );
      if (!firstItem) {
        throw new Error("Address suggestion not found");
      }
      firstItem.click();
    });


    //Delay
     await sleep(4000);

    /* --------------------------------------------------
       6️⃣ Trigger product search
    -------------------------------------------------- */
    console.log("🔍 Opening product search...");
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
        "zepto_search_ui_location.json",
        JSON.stringify(searchApiResponse, null, 2)
      );
      console.log("✅ zepto_search_ui_location.json saved");
    }

  } catch (err) {
    console.error("🔥 Error:", err.message);
  } finally {
    await browser.close();
  }
}

// 🔁 Try different addresses
runZeptoSearch("potato", "mahadevapura bangalore");
