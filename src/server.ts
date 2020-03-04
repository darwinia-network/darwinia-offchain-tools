import errorHandler from "errorhandler";

import app from "./app";
import Forever from "./ethereum/Forever";
import logger from "./util/logger";

const {
    AUTORUN,
} = process.env;

if (AUTORUN) {
    const forever = new Forever();
    forever.start();
}

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

// const ethereumProofStarter = new Starter();
// eslint-disable-next-line @typescript-eslint/no-empty-function
// ethereumProofStarter.start().then(() => {}).catch(() => {});

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
    logger.info(
        "  App is running at http://localhost:%d in %s mode",
        app.get("port"),
        app.get("env")
    );
    logger.info("  Press CTRL-C to stop\n");
});

export default server;
