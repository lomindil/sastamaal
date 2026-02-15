require("dotenv").config();
const app = require("./app");
const { initBrowsers, closeBrowsers } = require("./helpers/browser");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initBrowsers();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Backend running at http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    }
}

startServer();


const shutdown = async () => {
    console.log("🛑 Shutting down server...");
    await closeBrowsers();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", async (err) => {
    console.error("Uncaught exception:", err);
    await shutdown();
});
