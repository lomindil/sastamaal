module.exports = async function searchItems(page, {bigbasketState, query}) {
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

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
        await page.goto('https://www.bigbasket.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

                // Wait a bit to simulate real user (compatible version)
        await delay(2000);

  // 1️⃣ Restore cookies
    // if (bigbasketState.cookies?.length) {
    //     console.log("Restoring BigBasket cookies for search");
    //     await page.setCookie(bigbasketState.cookies);
    // }
    
    API_URL = `https://www.bigbasket.com/listing-svc/v2/products?type=ps&slug=${query}&page=1&bucket_id=32`;
        console.log(`Making API request to: ${API_URL}`);
        
        const response = await page.goto(API_URL, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        const responseText = await response.text();

  //console.log(responseText);
  let json;
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error("BigBasket search response not JSON");
  }

  // 3️⃣ Normalize items
  const widgets = json?.response?.widgets || [];
  const baseImgUrl = json?.base_img_url || "";

  const products = [];

function collectProducts(node) {
  if (!node || typeof node !== "object") return;

  // BigBasket product arrays always use `products`
  if (Array.isArray(node.products)) {
    products.push(...node.products);
  }

  for (const key of Object.keys(node)) {
    collectProducts(node[key]);
  }
}

for (const widget of widgets) {
  collectProducts(widget);
}
  console.log(products);

  return products.map(p => ({
    name: p?.name || "",
    brand: p?.brand || "",
    description: p?.desc || "",
    quantity: p?.pack_desc || "",
    price: p?.price?.mrp ?? null,
    offerPrice: p?.price?.sp ?? null,
    discount: p?.price?.discount ?? null,
    image: p?.images?.[0]?.url
      ? baseImgUrl + p.images[0].url
      : null
  }));
};
