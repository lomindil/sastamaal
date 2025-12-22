module.exports = async function selectLocation(page, { lat, lng, address }) {
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );

    await page.goto("https://www.swiggy.com/instamart", { waitUntil: "networkidle2" });

    await page.waitForFunction(() => window.App && window.App.deviceId, { timeout: 15000 }).catch(() => {});

    const payload = {
        data: {
            lat,
            lng,
            address,
            annotation: address,
            clientId: "INSTAMART-APP",
            addressId: ""
        }
    };

    const responseText = await page.evaluate(async (payload) => {
        const res = await fetch("https://www.swiggy.com/api/instamart/home/select-location/v2", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": "INSTAMART-APP",
                "Referer": "https://www.swiggy.com/instamart",
                "Origin": "https://www.swiggy.com"
            },
            body: JSON.stringify(payload),
            credentials: "include"
        });

        return await res.text();
    }, payload);

    let json = JSON.parse(responseText);

    function findPod(obj) {
        if (!obj) return null;
        if (typeof obj === "object" && obj.podId) return obj.podId;
        for (let k of Object.keys(obj)) {
            const res = typeof obj[k] === "object" && findPod(obj[k]);
            if (res) return res;
        }
        return null;
    }

    const podId = findPod(json);
    if (!podId) console.log("podId not found");
    
    return podId;
};
