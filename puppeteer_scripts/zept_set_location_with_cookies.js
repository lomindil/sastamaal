import puppeteer from "puppeteer";
import fs from "fs";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function setLocationAndSaveCookies(addressText) {
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

  console.log("🌐 Opening Zepto...");
  await page.goto("https://www.zepto.com/", {
    waitUntil: "networkidle2",
    timeout: 60000
  });

  // Open address dialog
  await page.waitForSelector('h3[data-testid="user-address"]');
  await page.evaluate(() => {
    document
      .querySelector('h3[data-testid="user-address"]')
      .closest("button")
      .click();
  });

  // Type address
  await page.waitForSelector('input[placeholder="Search a new address"]');
  const input = await page.$('input[placeholder="Search a new address"]');
  await input.click({ clickCount: 3 });
  await input.type(addressText, { delay: 80 });

  // Wait and click first suggestion
  await page.waitForSelector('div[data-testid="address-search-item"]');
  await page.evaluate(() => {
    document
      .querySelector('div[data-testid="address-search-item"]')
      .click();
  });

  // Wait for store cookies
  await sleep(5000);

  const cookies = await page.cookies();
  fs.writeFileSync(
    "zepto_cookies.json",
    JSON.stringify(cookies, null, 2)
  );

  console.log("✅ Cookies saved to zepto_cookies.json");

  await browser.close();
}

setLocationAndSaveCookies("Krishna nagar, Lucknow");
