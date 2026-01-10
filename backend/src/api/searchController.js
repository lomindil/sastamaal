const express = require("express");
const router = express.Router();

const swiggyService = require("../services/swiggyService");
const { blinkitSearch } = require("../blinkitService/blinkitSearch");
const { zeptoSearchItems } = require("../zeptoService/zeptoSearch");

const { decodePodId } = require("../../utils/cookie");
const { getBrowserIncognitoContext, getNonStealthBrowserIncognitoContext } = require("../helpers/browser");

const DEFAULT_POD_ID = 1374258;

router.post("/", async (req, res) => {
    let browserIncognitoContext;
    let nonStealthBrowserIncognitoContext;
    const output = {
        swiggy: { success: false, items: [] },
        blinkit: { success: false, items: [] },
        zepto: { success: false, items: [] }
    };

    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({
                success: false,
                error: "query required"
            });
        }

        const { lat, lon, address } = req.cookies || {};
        if (!lat || !lon || !address) {
            return res.status(400).json({
                success: false,
                error: "location cookies missing (lat, lon, address required)"
            });
        }
        const location_info = { lat, lon, address };

        let podId = DEFAULT_POD_ID;
        try {
            if (req.cookies?.swiggy_pod) {
                podId = decodePodId(req.cookies.swiggy_pod);
                console.log("Using podId from cookie:", podId);
            }
        } catch {
            console.warn("Invalid pod cookie, using default");
        }

        // Creating single browser instance for all services(except swigy)
        // browser = await getBrowser();
        // nonStealthBrowser = await getNonStealthBrowser();

        const [
            browserIncognitoContext,
            nonStealthBrowserIncognitoContext
        ] = await Promise.all([
            getBrowserIncognitoContext(),
            getNonStealthBrowserIncognitoContext()
        ]);
        // const swiggyRes = await swiggyService.searchItems(browser, podId, query);
        // const blinkitRes = await blinkitSearch(browser, location_info, query);
        // const zeptoRes = await zeptoSearchItems(browser, location_info, query);

        const [
            swiggyRes,
            blinkitRes,
            zeptoRes
        ] = await Promise.allSettled([
            swiggyService.searchItems(nonStealthBrowserIncognitoContext, podId, query), //swiggy uses its own browser instance
            blinkitSearch(browserIncognitoContext, location_info, query),
            zeptoSearchItems(browserIncognitoContext, location_info, query)
        ]);


        // const results = await Promise.allSettled([
        //     swiggyService.searchItems(browser, podId, query),
        //     blinkitSearch(browser, location_info, query),
        //     zeptoSearchItems(browser, location_info, query)
        // ]);
        
        // const [swiggyRes, blinkitRes, zeptoRes] = results.map(r =>
        //     r.status === "fulfilled" ? r.value : null
        // );
        

        output.swiggy = { success: true, items: swiggyRes || [] };
        output.blinkit = { success: true, items: blinkitRes || [] };
        output.zepto = { success: true, items: zeptoRes || [] };

        return res.json(output);

    }
    catch (err) {
        console.error("search route error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "internal server error",
            ...output
        });
    }
    finally {
        if (browserIncognitoContext) {
            await browserIncognitoContext.close();
        }
        if (nonStealthBrowserIncognitoContext) {
            await nonStealthBrowserIncognitoContext.close();
        }
    }
});

module.exports = router;
