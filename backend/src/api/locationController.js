const express = require("express");
const router = express.Router();
const swiggyService = require("../services/swiggyService");
const { encodePodId } = require("../../utils/cookie");

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
        const encodedPod = encodePodId(podId);

        res.cookie("swiggy_pod", encodedPod, {
            httpOnly: true,
            secure: true,        // true in production
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
	
            console.log("Swiggy location set, podId:", podId);
            results.swiggy = "success";
        } else {
            
            console.log("Swiggy location set failed, keeping default podId, no cookie set");
            results.swiggy = "failure";
        }

        res.cookie("lat", lat, {
            httpOnly: true,
            secure: true,        // true in production
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.cookie("lon", lng, {
            httpOnly: true,
            secure: true,        // true in production
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.cookie("address", address, {
            httpOnly: true,
            secure: true,        // true in production
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

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
