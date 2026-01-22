async function blockUnwantedResources(page) {
    await page.setRequestInterception(true);

    page.on("request", (req) => {
        const type = req.resourceType();
        const url = req.url();
        if (
            type === "image" ||
            type === "font" ||
            type === "media" ||
            type === "stylesheet" ||
            url.includes("analytics") ||
            url.includes("doubleclick") ||
            url.includes("googletagmanager") ||
            url.includes("facebook") ||
            url.includes("segment") ||
            url.includes("hotjar")
        ) {
            req.abort();
        } else {
            req.continue();
        }
    });
}

module.exports = { blockUnwantedResources };
