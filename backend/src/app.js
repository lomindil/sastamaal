const express = require("express");
const cors = require("cors");

const apiRoutes = require("./api");

const app = express();

app.use(cors());
app.use(express.json());

// Everything goes under /api
app.use("/api", apiRoutes);

module.exports = app;
