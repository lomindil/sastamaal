const { getBrowser } = require("../scrapers/bigbasketBrowser");
const selectLocation = require("../scrapers/bigbasketLocation");
const searchItems = require("../scrapers/bigbasketSearch");

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

    async searchItems(query) {
        const browser = await getBrowser();
        const page = await browser.newPage();
        try {
            return await searchItems(page, { query });
        } finally {
            await page.close();
        }
    }
};
