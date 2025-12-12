const express = require("express");
const router = express.Router();
const swiggyService = require("../services/swiggyService");
const storeState = require("../state/storeState");

router.post("/", async (req, res) => {
    try {
        const { lat, lng, address } = req.body;

        if (typeof lat !== "number" || typeof lng !== "number") {
            return res.status(400).json({
                success: false,
                error: "lat & lng must be numbers"
            });
        }

        const results = {
            swiggy: "failure",
            blinkit: "not_implemented",
            zepto: "not_implemented"
        };
        
        console.log("Calling Swiggy Service for location Update\n");
        const podId = await swiggyService.submitLocation({ lat, lng, address });
        if (podId) {
            storeState.swiggy.podId = podId;
            storeState.swiggy.lastLocationSuccess = true;
            console.log("Swiggy location set, podId:", podId);
            results.swiggy = "success";
        } else {
            // keep default podId 
            storeState.swiggy.lastLocationSuccess = false;
            console.log("Swiggy location set failed, keeping default podId");
            results.swiggy = "failure";
        }

        // placeholder for other services
        // not implemented yet, respond success:false (placeholder)
        return res.json(results);

        return res.status(400).json({ success: false, error: "unknown service" });
    } catch (err) {
        console.error("location route error:", err);
            return res.status(500).json({
            success: false,
            error: err.message,
            ...results
        });
    }
});

module.exports = router;
