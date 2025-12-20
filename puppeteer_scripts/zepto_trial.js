import puppeteer from "puppeteer";
import fs from "fs";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runZeptoSearch = async (query) => {
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
  page.on("response", async (response) => {
    try {
      const request = response.request();
      const url = response.url();

      if (
        url.endsWith("/api/v3/search") &&
        request.method() === "POST"
      ) {
        const postData = request.postData();
        if (!postData) return;

        const body = JSON.parse(postData);
        if (!body.query) return;

        console.log("✅ REAL PRODUCT SEARCH CAPTURED");
        console.log("🔍 Query:", body.query);

        searchApiResponse = await response.json();
      }
    } catch {
      // ignore protocol noise
    }
  });

  try {
    console.log("🌐 Opening Zepto homepage...");
    await page.goto("https://www.zepto.com/", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await sleep(3000);
    console.log("📍 Injecting location cookies");

    const latitude = 23.2659074;
    const longitude = 	77.4123565;
    const storeId = "20c47a85-2b47-41d8-a02f-8a9b34c8bb4b";

    await page.setCookie(
      {
        name: "latitude",
        value: String(latitude),
        domain: "www.zepto.com",
        path: "/"
      },
      {
        name: "longitude",
        value: String(longitude),
        domain: "www.zepto.com",
        path: "/"
      },
      {
        name: "user_position",
        value: JSON.stringify({
          latitude,
          longitude
        }),
        domain: "www.zepto.com",
        path: "/"
      },
      // {
      //   name: "serviceability",
      //   value: JSON.stringify({
      //     primaryStore: {
      //       serviceable: true,
      //       storeId,
      //       storeConstruct: "PRIMARY_STORE",
      //       etaInMinutes: 12,
      //       isDeliverable: true,
      //       isNightlyStore: false
      //     },
      //     etaInformation: {
      //       secondaryText: "12 minutes"
      //     },
      //     storeDetailedInfo: {
      //       city: "Lucknow",
      //       name: "LKO-Khera Para"
      //     },
      //     timeSaved: Date.now()
      //   }),
      //   domain: "www.zepto.com",
      //   path: "/"
      // }
    );

    await sleep(2000);

    console.log("🔍 Opening search page...");
    await page.goto(
      `https://www.zepto.com/search?query=${encodeURIComponent(query)}`,
      {
        waitUntil: "networkidle2",
        timeout: 60000
      }
    );

    await sleep(4000);

    // -----------------------------------
    // 4️⃣ SAVE RESULT
    // -----------------------------------
    if (!searchApiResponse) {
      console.log("❌ Search API response not captured");
    } else {
      fs.writeFileSync(
        "zepto_search.json",
        JSON.stringify(searchApiResponse, null, 2)
      );
      console.log("✅ zepto__trial_search.json saved");
    }

  } catch (err) {
    console.error("🔥 Error:", err);
  } finally {
    await browser.close();
  }
};

runZeptoSearch("apple");