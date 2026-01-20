const axios = require("axios");
const fs = require("fs");

const URL = "http://localhost:3000/api/search";

const HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Cookie": "lat=28.4646148; lon=77.0299194; address=Gurgaon, Haryana, India"
};

const PAYLOAD = { query: "milk" };

const CONCURRENT_USERS = 10;
const TOTAL_REQUESTS = 20;
const TIMEOUT = 60_000; // 60s


async function invokeApi(userId) {
    const startTime = Date.now();

    try {
        const response = await axios.post(URL, PAYLOAD, {
            headers: HEADERS,
            timeout: TIMEOUT
        });

        const duration = (Date.now() - startTime) / 1000;

        if (response.status !== 200) {
            return {
                userId,
                error: `HTTP ${response.status}`,
                duration,
                body: response.data
            };
        }

        return null; // success → ignore

    } catch (err) {
        return {
            userId,
            error: err.message,
            duration: null
        };
    }
}


async function startLoadTest() {
    console.log("\n🚀 Running load test");
    console.log(`Concurrent users: ${CONCURRENT_USERS}`);
    console.log(`Total requests: ${TOTAL_REQUESTS}\n`);

    const errors = [];
    const startTest = Date.now();

    let index = 0;

    async function worker() {
        while (index < TOTAL_REQUESTS) {
            const current = index++;
            const result = await invokeApi(current);
            if (result) errors.push(result);
        }
    }

    // Run concurrent workers
    await Promise.all(
        Array.from({ length: CONCURRENT_USERS }, worker)
    );

    const totalTime = (Date.now() - startTest) / 1000;

    console.log("📊 Load Test Summary");
    console.log("-------------------");
    console.log(`Total Requests: ${TOTAL_REQUESTS}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Total Test Time: ${totalTime.toFixed(2)}s`);

    if (errors.length > 0) {
        fs.writeFileSync("errors.json", JSON.stringify(errors, null, 2));
        console.log("❌ Errors saved to errors.json");
    } else {
        console.log("✅ No errors detected");
    }
}


startLoadTest();
