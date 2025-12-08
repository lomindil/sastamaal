const express = require("express");
const router = express.Router();

router.use("/location", require("./locationController"));
router.use("/search", require("./searchController"));

module.exports = router;
