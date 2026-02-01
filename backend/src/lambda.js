// const serverlessExpress = require("@vendia/serverless-express");
// const app = require("./app");

// exports.handler = serverlessExpress({ app });


// const serverlessExpress = require("@vendia/serverless-express");
// const app = require("./app");
// const { initBrowsers } = require("./helpers/browser");

// let serverlessHandler;
// let browserInitialized = false;

// exports.handler = async (event, context) => {
//     // Prevent Lambda from freezing the browser
//     context.callbackWaitsForEmptyEventLoop = false;

//     if (!browserInitialized) {
//         console.log("🚀 Initializing browser (cold start)");
//         await initBrowsers();
//         browserInitialized = true;
//     }

//     if (!serverlessHandler) {
//         serverlessHandler = serverlessExpress({ app });
//     }

//     return serverlessHandler(event, context);
// };


const serverlessExpress = require("@vendia/serverless-express");
const app = require("./app");
const { initBrowsers } = require("./helpers/browser");

let handler;
let isInitialized = false;

async function bootstrap() {
    if (!isInitialized) {
        console.log("🚀 Cold start: initializing browser");
        await initBrowsers();     // browser starts immediately on container start
        handler = serverlessExpress({ app });
        isInitialized = true;
    }
}

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    await bootstrap();
    return handler(event, context);
};
