const express = require("express");
const router = express.Router();
const swiggyService = require("../services/swiggyService");

router.post("/", async (req, res) => {
    try {
        const { lat, lng, address } = req.body;

        if (!lat || !lng)
            return res.status(400).json({ error: "lat & lng required" });

        const podId = await swiggyService.submitLocation({ lat, lng, address });

        res.json({ success: true, podId });
    } catch (err) {
        console.error("location error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
