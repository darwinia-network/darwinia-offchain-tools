/* eslint-disable @typescript-eslint/no-empty-function */
import { fork, ChildProcess } from "child_process";
import { join } from "path";
import { BlockNumber } from "web3-core";
import logger from "../util/logger";
import { storageToFile, readFromFile } from "./Utils";
import Config from "./Config";

import fs from "fs";
export default class Forever {

    private forkStarter: ChildProcess;
    private finalizedBlockNumber: BlockNumber;
    private blockTimer: NodeJS.Timeout;

    public start() {
        this.startRelay();
        this.forever();
    }

    private killForkStarter(forkStarter: ChildProcess) {
        if (forkStarter && !forkStarter.killed) {
            forkStarter.kill();
        }
    }

    private async startRelay() {
        this.killForkStarter(this.forkStarter);

        this.forkStarter = fork(join(__dirname, "../ethereum/ForkStarter.js"));

        if (!this.finalizedBlockNumber) {
            this.finalizedBlockNumber = readFromFile(Config.FINALIZED_BLOCK_NUMBER);
        }
        this.forkStarter.send({
            finalizedBlockNumber: parseInt(this.finalizedBlockNumber.toString()),
        });

        this.forkStarter.on("message", async (code) => {
            code && logger.info("Successfully submitted to Eth Relay: ", code);
            logger.info("");
            if (code && code.finalizedBlockNumber) {
                if(parseInt(this.finalizedBlockNumber.toString()) + 1 === parseInt(code.finalizedBlockNumber.toString())) {
                    this.finalizedBlockNumber = code.finalizedBlockNumber;
                    await storageToFile(Config.FINALIZED_BLOCK_NUMBER, this.finalizedBlockNumber.toString(), () => {
                        
                    });
                }
            }

            clearTimeout(this.blockTimer);

            this.blockTimer = setTimeout(() => {
                logger.error("The child process is unresponsive for a long time and will be restarted！");
                this.killForkStarter(this.forkStarter);
            }, 60000);
        });
    };

    private forever() {
        setTimeout(() => {
            
            if (!this.forkStarter || this.forkStarter.killed) {
                logger.info("Child process has been killed");
                this.forkStarter = null;
                this.startRelay();
            }
            this.forever();
        }, 120000);
    }
}