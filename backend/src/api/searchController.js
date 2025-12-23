const express = require("express");
const router = express.Router();
const swiggyService = require("../services/swiggyService");
const { blinkitSearch } = require("../blinkitService/blinkitSearch");
const { decodePodId } = require("../../utils/cookie");

const DEFAULT_POD_ID = 1374258;

router.post("/", async (req, res) => {
    let output = {
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

        const {
            lat,
            lon,
            address
        } = req.cookies || {};

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
        } catch (e) {
            console.warn("Invalid pod cookie, using default");
            podId = DEFAULT_POD_ID;
        }

        const swiggyPromise = swiggyService.searchItems(podId, query);
        const blinkitPromise = blinkitSearch(location_info, query);

        const swiggyResult = await swiggyPromise;

        output.swiggy = { success: true, items: swiggyResult };

        const blinkitResult = await blinkitPromise;
        output.blinkit = { success: true, items: blinkitResult };

        return res.json(output);
    } catch (err) {
        console.error("search route error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "internal server error",
            ...output
        });
    }
});

module.exports = router;
