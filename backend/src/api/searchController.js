const express = require("express");
const router = express.Router();
const swiggyService = require("../services/swiggyService");
const storeState = require("../state/storeState");
const requireAuth = require("../middleware/requireAuth");

router.post("/", requireAuth, async (req, res) => {
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

            const podId = storeState.swiggy.podId;
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
