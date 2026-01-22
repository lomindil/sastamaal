const express = require("express");
const router = express.Router();

const swiggyService = require("../services/swiggyService");
const { blinkitSearch } = require("../blinkitService/blinkitSearch");
const { zeptoSearchItems } = require("../zeptoService/zeptoSearch");
const { decodePodId } = require("../../utils/cookie");

const DEFAULT_POD_ID = 1374258;

router.post("/", async (req, res) => {
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

        const results = await Promise.allSettled([
            // swiggyService.searchItems(podId, query),
            blinkitSearch(location_info, query),
            zeptoSearchItems(location_info, query)
        ]);

        const [ blinkitRes, zeptoRes  ] = results;

        // if (swiggyRes.status === "fulfilled") {
        //     output.swiggy = { success: true, items: swiggyRes.value };
        // }

        if (blinkitRes.status === "fulfilled") {
            output.blinkit = { success: true, items: blinkitRes.value };
        }

        if (zeptoRes.status === "fulfilled") {
            output.zepto = { success: true, items: zeptoRes.value };
        }

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
