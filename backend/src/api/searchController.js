const express = require("express");
const router = express.Router();
const swiggyService = require("../services/swiggyService");
const storeState = require("../state/storeState");

router.post("/", async (req, res) => {
    try {
        const { service, query } = req.body;
        if (!service) return res.status(400).json({ success: false, error: "service required" });
        if (!query) return res.status(400).json({ success: false, error: "query required" });

        if (service === "swiggy") {
            const podId = storeState.swiggy.podId;
            const items = await swiggyService.searchItems(podId, query);
            // items are already normalized by swiggy search module
            return res.json({ success: true, items });
        }
            // placeholders for other services
        if (service === "blinkit" || service === "zepto") {
            return res.json({ success: false, error: "service not implemented yet" });
        }

        return res.status(400).json({ success: false, error: "unknown service" });

    } catch (err) {
    console.error("search route error:", err);
    return res.status(500).json({ success: false, error: err.message || "internal error" });
  }
});

module.exports = router;
