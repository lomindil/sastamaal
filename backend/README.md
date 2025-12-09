# Sastamaal Backend


## Setup


1. `cd backend`
2. `npm install`
3. `npm run dev` (or `npm start`)


Routes:
- POST /api/location { service, lat, lng, address } -> { response status }
- POST /api/search { service, itemquery } -> { items }


Note: This backend calls the appropriate quick commerce service's internal APIs using Puppeteer to mimic browser behaviour. Keep running this on a server you control. Puppeteer will open a headless browser. Use responsibly and check Swiggy/Blinkit/Zepto ToS for allowed usage.
