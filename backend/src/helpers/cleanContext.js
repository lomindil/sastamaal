async function cleanContext(context) {
    try {
        const cookies = await context.cookies();
        if (cookies.length > 0) {
            await context.clearCookies();
        }
        const pages = await context.pages();

        await Promise.all(
            pages.map(async (page) => {
                try {
                    await page.evaluate(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                    });
                } catch (_) {
                }
            })
        );
        await context.clearPermissionOverrides();

    } catch (err) {
        console.warn("⚠️ Failed to clean context:", err.message);
    }
}

module.exports = { cleanContext };
