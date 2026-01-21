async function cleanContext(context) {
    try {
        const pages = await context.pages();

        // 1️⃣ Clear cookies via CDP (Puppeteer way)
        if (pages.length > 0) {
            const page = pages[0];
            const client = await page.target().createCDPSession();
            await client.send("Network.clearBrowserCookies");
            await client.send("Network.clearBrowserCache");
        }

        // 2️⃣ Clear localStorage & sessionStorage
        await Promise.all(
            pages.map(async (page) => {
                try {
                    await page.evaluate(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                    });
                } catch (_) {
                    // page might already be closed
                }
            })
        );

        // 3️⃣ Clear permission overrides
        await context.clearPermissionOverrides();

    } catch (err) {
        console.warn("⚠️ Failed to clean context:", err.message);
    }
}

module.exports = { cleanContext };

