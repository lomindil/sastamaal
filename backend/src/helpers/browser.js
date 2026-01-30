const puppeteer = require("puppeteer");
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteerExtra.use(StealthPlugin());

let stealthBrowser = null;
let nonStealthBrowser = null;


async function initBrowsers() {
    if (!stealthBrowser) {
        console.log("🚀 Launching stealth browser...");
        stealthBrowser = await puppeteerExtra.launch({
            headless: "false",
            defaultViewport: null,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--window-size=1920,1080"
            ]
        });
    }

    if (!nonStealthBrowser) {
        console.log("🚀 Launching non-stealth browser...");
        nonStealthBrowser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--window-size=1920,1080"
            ]
        });
    }
}

async function getStealthContext() {
    if (!stealthBrowser) {
        throw new Error("Stealth browser not initialized");
    }
    return await stealthBrowser.createBrowserContext();
}

async function getNonStealthContext() {
    if (!nonStealthBrowser) {
        throw new Error("Non-stealth browser not initialized");
    }
    return await nonStealthBrowser.createBrowserContext();
}


async function closeBrowsers() {
    console.log("🛑 Closing browsers...");
    if (stealthBrowser) await stealthBrowser.close();
    if (nonStealthBrowser) await nonStealthBrowser.close();
    stealthBrowser = null;
    nonStealthBrowser = null;
}

module.exports = {
    initBrowsers,
    getStealthContext,
    getNonStealthContext,
    closeBrowsers
};



