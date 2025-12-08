const puppeteer = require("puppeteer");

let browser = null;

async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    }
    return browser;
}

module.exports = { getBrowser };
