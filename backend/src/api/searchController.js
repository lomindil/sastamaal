const express = require("express");
const router = express.Router();
const swiggyService = require("../services/swiggyService");

router.post("/", async (req, res) => {
    try {
        const { podId, query } = req.body;

        if (!podId || !query)
            return res.status(400).json({ error: "podId & query required" });

        const items = await swiggyService.searchItems(podId, query);

        res.json({ success: true, items });
    } catch (err) {
        console.error("search error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
