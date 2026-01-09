# Puppeteer Headless Scraping Guide

## Problem
`headless: true` fails for scraping; `headless: false` works because modern websites detect headless browsers via:
- `navigator.webdriver`
- Browser fingerprints
- Missing GPU/plugins/WebGL
- Non-human timings

## Solution

### Installation
```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

### Browser Launch
```javascript
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
    headless: "new",
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1366,768"
    ],
    defaultViewport: { width: 1366, height: 768 }
});
```

### Hide Automation Signals
```javascript
await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
});

await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
);
```

### Navigation
```javascript
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
```

## Production Best Practices
- ✅ Use `headless: "new"`
- ✅ Use residential/ISP proxies (avoid AWS Lambda IPs)
- ✅ Rotate IPs per request
- ✅ Implement browser pooling
- ✅ Cache results (5–10 min)
