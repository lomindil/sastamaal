const puppeteer = require("puppeteer");

function delay(t) {
    return new Promise(res => setTimeout(res, t));
}

async function run() {
    let browser = null;

    try {
        console.log("Launching Puppeteer…");

        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--window-size=1920,1080"
            ]
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
        );

        console.log("Visiting Instamart...");
        await page.goto("https://www.swiggy.com/instamart", {
            waitUntil: "networkidle2",
			credentials: "include",
            timeout: 30000
        });

console.log("Waiting for Instamart app initialization...");
await page.waitForFunction(() => window.App && window.App.deviceId, { timeout: 15000 });

await delay(3000); // allow cookies like sid to populate

        const payload = {
            data: {
                lat: 12.936285,
                lng: 77.6127996,
                address: "7th Block, Koramangala, Bengaluru, Karnataka",
                annotation: "7th Block, Koramangala, Bengaluru, Karnataka",
                clientId: "INSTAMART-APP",
                addressId: ""
            }
        };

        console.log("Sending POST request…");

        const postResponse = await page.evaluate(async (payload) => {
            const headers = {
                "Content-Type": "application/json",
                "x-client-id": "INSTAMART-APP",
                "x-platform": "web",
                "Accept": "application/json, text/plain, */*"
            };

            const res = await fetch(
                "https://www.swiggy.com/api/instamart/home/select-location/v2",
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                    credentials: "include"
                }
            );

            const text = await res.text();

            return {
                status: res.status,
                body: text
            };
        }, payload);

        console.log("\nPOST Response:");
        console.log(JSON.stringify(JSON.parse(postResponse.body), null, 2));

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        if (browser) {
            await browser.close();
            console.log("Browser closed.");
        }
    }
}

run(); // ⭐ Run async main function
