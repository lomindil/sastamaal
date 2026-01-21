async function cleanContext(context) {
    try {
        // 1️⃣ Clear cookies
        const cookies = await context.cookies();
        if (cookies.length > 0) {
            await context.clearCookies();
        }

        // 2️⃣ Clear storage for all pages
        const pages = await context.pages();

        await Promise.all(
            pages.map(async (page) => {
                try {
                    await page.evaluate(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                    });
                } catch (_) {
                    // page might be already closed
                }
            })
        );

        // 3️⃣ Optional: Clear cache
        await context.clearPermissionOverrides();

    } catch (err) {
        console.warn("⚠️ Failed to clean context:", err.message);
    }
}

module.exports = { cleanContext };
