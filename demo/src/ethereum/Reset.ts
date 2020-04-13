/* eslint-disable @typescript-eslint/no-empty-function */
import logger from "../util/logger";
import { storageToFile } from "./Utils";
import Config from "./Config";
function resetStatus() {
    storageToFile(Config.FINALIZED_BLOCK_NUMBER, "1", () => {
        logger.info("reset finalizedBlockNumber success");
    });

    storageToFile(Config.HAS_RESET_GENESISHEADER, "", () => {
        logger.info("reset hasResetGenesisHeader success");
    });
}

resetStatus();