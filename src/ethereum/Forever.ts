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
            finalizedBlockNumber: this.finalizedBlockNumber,
        });

        this.forkStarter.on("message", (code) => {
            console.log("已完成：", code);
            if (code && code.finalizedBlockNumber) {
                this.finalizedBlockNumber = code.finalizedBlockNumber;
                this.storageToFile(this.finalizedBlockNumber);
            }

            clearTimeout(this.blockTimer);

            this.blockTimer = setTimeout(() => {
                logger.info("killing");
                this.killForkStarter(this.forkStarter);
            }, 60000);
        });
    };

    private forever() {
        setTimeout(() => {
            logger.info("online....");
            if (!this.forkStarter || this.forkStarter.killed) {
                logger.info("检测到节点killed，将重启节点");
                this.forkStarter = null;
                this.startRelay();
            }
            this.forever();
        }, 30000);
    }
}