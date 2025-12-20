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

  // Capture search API
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
       1️⃣ Click the address button (opens dialog)
    -------------------------------------------------- */
    console.log("📍 Opening address dialog...");

    await page.waitForSelector(
      'button[aria-haspopup="dialog"] h3[data-testid="user-address"]',
      { timeout: 20000 }
    );

    // Click the parent <button>
    await page.evaluate(() => {
      const h3 = document.querySelector(
        'h3[data-testid="user-address"]'
      );
      h3.closest("button").click();
    });

    /* --------------------------------------------------
       2️⃣ Wait for location input
    -------------------------------------------------- */
    await page.waitForSelector(
      'input[placeholder="Search a new address"]',
      { timeout: 20000 }
    );

    const locationInput = await page.$(
      'input[placeholder="Search a new address"]'
    );

    /* --------------------------------------------------
       3️⃣ Type address / pincode
    -------------------------------------------------- */
    console.log("⌨️ Typing address...");
    await locationInput.click({ clickCount: 3 });
    await locationInput.type(addressText, { delay: 80 });

    // Allow suggestions to load
    await sleep(2000);

    /* --------------------------------------------------
       4️⃣ Select first suggestion
    -------------------------------------------------- */
    console.log("📌 Selecting address suggestion...");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    /* --------------------------------------------------
       5️⃣ Wait for store resolution (cookie-based)
    -------------------------------------------------- */
    console.log("⏳ Waiting for store assignment...");
    await page.waitForFunction(
      () =>
        document.cookie.includes("store_id") ||
        document.cookie.includes("prev_store_id"),
      { timeout: 30000 }
    );

    console.log("✅ Location set successfully");

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
runZeptoSearch("potato", "Akash Nagar Bengaluru");
