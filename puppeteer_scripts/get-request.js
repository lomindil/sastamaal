const puppeteer = require('puppeteer');

// Configuration
const API_URL = 'https://www.swiggy.com/api/instamart/search/suggest-items/v2?query=gr&storeId=1404614&primaryStoreId=1404614&secondaryStoreId=&trackingId=_bw675amg2';//
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function fetchAPIWithStealth() {
    let browser;
    
    try {
        console.log('Launching Puppeteer with stealth settings...');
        
        // Launch browser with more realistic settings
        browser = await puppeteer.launch({
            headless: true, // Use 'true' instead of 'new' for compatibility
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--window-size=1920,1080'
            ]
        });
        
        // Create a new page
        const page = await browser.newPage();
        
        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set additional headers to mimic a real browser
        await page.setExtraHTTPHeaders({
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Upgrade-Insecure-Requests': '1'
        });
        
        // Remove webdriver property to avoid detection
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        });
        
        console.log(`Navigating to API endpoint...`);
        
        // Optional: First visit the main site to get cookies
        console.log('Visiting main site first to establish session...');
        await page.goto('https://www.swiggy.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait a bit to simulate real user (compatible version)
        await delay(2000);
        
        // Now make the API request
        console.log(`Making API request to: ${API_URL}`);
        
        const response = await page.goto(API_URL, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // Check if request was successful
        if (!response.ok()) {
            console.log(`Response status: ${response.status()} ${response.statusText()}`);
        }
        
        // Get the response content
        const responseBody = await response.text();
       
            // Try to parse as JSON if possible
            try {
                const jsonResponse = JSON.parse(responseBody);
                console.log('\n=== API Response (JSON) ===');
                console.log(JSON.stringify(jsonResponse, null, 2));
            } catch (e) {
                // If not JSON, display as text
                console.log('\n=== API Response (Text) ===');
                console.log(responseBody.substring(0, 500) + '...');
            }
        
        // Display response headers
        const responseHeaders = response.headers();
        console.log('\n=== Response Headers ===');
        Object.entries(responseHeaders).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.message.includes('Navigation timeout')) {
            console.log('The request timed out. The site might be blocking the request.');
        }
        console.error('Stack:', error.stack);
    } finally {
        // Always close the browser
        if (browser) {
            await browser.close();
            console.log('\nBrowser closed.');
        }
    }
}

// Main execution
(async () => {
    console.log('Starting Puppeteer API fetcher (compatible version)...');
    console.log('=====================================================\n');
    
    // Check Puppeteer version
    const puppeteerPackage = require('./node_modules/puppeteer/package.json');
    console.log(`Puppeteer version: ${puppeteerPackage.version}`);
   
    console.log('\n--- Trying Method 1: Stealth approach ---');
    await fetchAPIWithStealth();
  
    
    console.log('\nScript execution completed.');
})();
