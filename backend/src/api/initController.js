const express = require("express");
const router = express.Router();
const { generateAuthKey } = require("../state/authStore");

router.get("/", (req, res) => {
  const { key, expiresAt } = generateAuthKey();

  res.json({
    authKey: key,
    expiresIn: Math.floor((expiresAt - Date.now()) / 1000),
  });
});

module.exports = router;
