// const puppeteer = require("puppeteer");
// const puppeteer_extra = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// puppeteer_extra.use(StealthPlugin());

// let browser = null;
// let nonStealthBrowser = null;

// async function getBrowser() {
//     if (!browser) {
//         try {

//         console.log("Launching browser...");
//         browser = await puppeteer_extra.launch({
//             headless: "new",
//             defaultViewport: null,
//             args: [
//                 "--no-sandbox",
//                 "--disable-setuid-sandbox",
//                 "--disable-blink-features=AutomationControlled",
//                 "--window-size=1920,1080"
//             ]
//         });

//         // browser = await puppeteer.launch({
//         //     headless: false,
//         //     args: [
//         //         "--no-sandbox",
//         //         "--disable-setuid-sandbox",
//         //         "--disable-blink-features=AutomationControlled",
//         //         "--window-size=1920,1080"
//         //     ]
//         // });

//         } catch (err) {
//             browser = null;
//             throw err;
//         }
//     }
//     return browser;
// }

// async function getNonStealthBrowser() {
//     if (!nonStealthBrowser) {
//         try {

//         console.log("Launching non-stealth browser...");
//         nonStealthBrowser = await puppeteer.launch({
//             headless: true,
//             args: [
//                 "--no-sandbox",
//                 "--disable-setuid-sandbox",
//                 "--disable-blink-features=AutomationControlled",
//                 "--window-size=1920,1080"
//             ]
//         });

//         } catch (err) {
//             nonStealthBrowser = null;
//             throw err;
//         }
//     }
//     return nonStealthBrowser;
// }

// async function getBrowserIncognitoContext() {
//     const browserInstance = await getBrowser();
//     return await browserInstance.createBrowserContext();
// }

// async function getNonStealthBrowserIncognitoContext() {
//     const browserInstance = await getNonStealthBrowser();
//     return await browserInstance.createBrowserContext();
// }

// async function closeBrowser() {
//     if (browser) {
//         await browser.close();
//         browser = null;
//     }
// }

// module.exports = { getBrowserIncognitoContext, getNonStealthBrowserIncognitoContext };


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
            headless: "new",
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
            headless: true,
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



