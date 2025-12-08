const { getBrowser } = require("../scrapers/swiggyBrowser");
const selectLocation = require("../scrapers/swiggyLocation");
const searchItems = require("../scrapers/swiggySearch");

module.exports = {
    async submitLocation({ lat, lng, address }) {
        const browser = await getBrowser();
        const page = await browser.newPage();
        try {
            return await selectLocation(page, { lat, lng, address });
        } finally {
            await page.close();
        }
    },

    async searchItems(podId, query) {
        const browser = await getBrowser();
        const page = await browser.newPage();
        try {
            return await searchItems(page, { podId, query });
        } finally {
            await page.close();
        }
    }
};
