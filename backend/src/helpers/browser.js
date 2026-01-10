const puppeteer = require("puppeteer");
const puppeteer_extra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer_extra.use(StealthPlugin());

let browser = null;

async function getBrowser() {
    if (!browser) {
        try {

        console.log("Launching browser...");
        browser = await puppeteer_extra.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            headless: "new",
            defaultViewport: null,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-blink-features=AutomationControlled",
              "--disable-dev-shm-usage",
              "--disable-gpu",
              "--single-process"
            ]
          });

        // browser = await puppeteer.launch({
        //     headless: false,
        //     args: [
        //         "--no-sandbox",
        //         "--disable-setuid-sandbox",
        //         "--disable-blink-features=AutomationControlled",
        //         "--window-size=1920,1080"
        //     ]
        // });

        } catch (err) {
            browser = null;
            throw err;
        }
    }
    return browser;
}

async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

module.exports = { getBrowser, closeBrowser };
