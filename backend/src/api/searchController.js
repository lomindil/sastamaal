const express = require("express");
const router = express.Router();
const swiggyService = require("../services/swiggyService");
const { decodePodId } = require("../../utils/cookie");

const DEFAULT_POD_ID = 1374258;

router.post("/", async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: "query required"
            });
        }

        const output = {
            swiggy: { success: false, items: [] },
            blinkit: { success: false, items: [] },
            zepto: { success: false, items: [] }
        };

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
            const items = await swiggyService.searchItems(podId, query);
            output.swiggy = { success: true, items };


            // items are already normalized by swiggy search module
            return res.json(output);

            // placeholders for other services

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
