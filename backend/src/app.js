require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const apiRoutes = require("./api");

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use("/api", apiRoutes);
app.get("/health", (req, res)=> {
    res.status(200).send("Okay");
})


module.exports = app;
