/* eslint-disable @typescript-eslint/no-empty-function */
import { fork, ChildProcess } from "child_process";
import { join } from "path";
import { BlockNumber } from "web3-core";
import logger from "../util/logger";
import fs from "fs";
export default class Forever {

    private forkStarter: ChildProcess;
    private finalizedBlockNumber: BlockNumber;
    private blockTimer: NodeJS.Timeout;

    private killedNumber = 0;

    public start() {
        this.startRelay();
        this.forever();
    }

    private storageToFile(number: BlockNumber) {
        fs.writeFile("finalizedBlockNumber", number.toString(), function (err) {
            if (err) {
                return console.error(err);
            }
        });
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
            this.finalizedBlockNumber = fs.readFileSync("finalizedBlockNumber").toString();
        }
        this.forkStarter.send({
            finalizedBlockNumber: parseInt(this.finalizedBlockNumber.toString()) - (this.killedNumber % 2),
        });

        this.forkStarter.on("message", (code) => {
            console.log("finalizedBlockNumber：", code);
            if (code && code.finalizedBlockNumber) {
                if(parseInt(this.finalizedBlockNumber.toString()) + 1 === parseInt(code.finalizedBlockNumber.toString())) {
                    console.log(this.finalizedBlockNumber, code.finalizedBlockNumber + 1);
                    this.finalizedBlockNumber = code.finalizedBlockNumber;
                    this.storageToFile(this.finalizedBlockNumber);
                }
            }

            clearTimeout(this.blockTimer);

            this.blockTimer = setTimeout(() => {
                logger.info("killing");
                this.killForkStarter(this.forkStarter);
                this.killedNumber = this.killedNumber + 1;
            }, 60000);
        });
    };

    private forever() {
        setTimeout(() => {
            
            if (!this.forkStarter || this.forkStarter.killed) {
                logger.info("killed...");
                this.forkStarter = null;
                this.startRelay();
            } else {
                logger.info("online...");
            }
            this.forever();
        }, 120000);
    }
}