const express = require("express");
const router = express.Router();
const swiggyService = require("../services/swiggyService");
const storeState = require("../state/storeState");

router.post("/", async (req, res) => {
    try {
        const { service, lat, lng, address } = req.body;
        if (!service)
            return res.status(400).json({ success: false, error: "service required" });

        if (typeof lat !== "number" || typeof lng !== "number") 
                return res.status(400).json({ success: false, error: "lat and lng must be numbers" });
        
        if (service === "swiggy") {
            const podId = await swiggyService.submitLocation({ lat, lng, address });
            if (podId) {
                storeState.swiggy.podId = podId;
                storeState.swiggy.lastLocationSuccess = true;
                console.log("Swiggy location set, podId:", podId);
                return res.json({ success: true });
            } else {
                // keep default podId 
                storeState.swiggy.lastLocationSuccess = false;
                console.log("Swiggy location set failed, keeping default podId");
                return res.json({ success: false, error: "internal select-location failed" });
            }
        }

          // placeholder for other services
        if (service === "blinkit" || service === "zepto") {
            // not implemented yet, respond success:false (placeholder)
            return res.json({ success: false, error: "service not implemented yet" });
        }

        return res.status(400).json({ success: false, error: "unknown service" });
    } catch (err) {
        console.error("location route error:", err);
        return res.status(500).json({ success: false, error: err.message || "internal error" });
    }
});

module.exports = router;
