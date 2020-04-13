/* eslint-disable @typescript-eslint/no-empty-function */
import { setDelay } from "./Utils";
import { BlockchainState } from "./BlockchainState";
import ProofSubmit from "./Proof";
import Config from "./Config";
import API from "./API";
import logger from "../util/logger";

const blockchainState = new BlockchainState();
const proofSubmit = new ProofSubmit();
const api = new API();

export default class Starter {
    async start(): Promise<any> {
        try {
            logger.info("starting proof server!");
            process.send({ starter: ""});
            await api.start();
            this.startBlockChainState();
            this.startSubmitToDarwinia();
        } catch (e) {
            logger.error("Main Starter catch error: " + e);
            // setDelay(5000).then(() => {
            //     this.start();
            // });
        }
    }

    async startAPI(): Promise<any> {
        try {
            await api.start();
        } catch (e) {
            logger.error("startAPI catch error: " + e);
            setDelay(5000).then(() => {
                this.startAPI();
            });
        }
    }

    async startSubmitToDarwinia(): Promise<any> {
        logger.info("start SubmitToDarwinia");
        try {
            await proofSubmit.start();
        } catch (error) {
            logger.error("startSubmitToDarwinia " + error);
            this.scheduleStartSubmitToDarwinia();
        }
    }

    startBlockChainState(): void {
        logger.info("start BlockChainState");

        blockchainState.getState().then(() => {
            this.scheduleStartBlockChainState();
        }).catch((error) => {
            logger.error("startBlockChainState " + error);
            this.scheduleStartBlockChainState();
        });
    }

    private scheduleStartBlockChainState(delay: number = Config.blockchainStateDelay) {
        setDelay(delay).then(() => {
            this.startBlockChainState();
        });
    }

    private scheduleStartSubmitToDarwinia(delay: number = Config.startSubmitToDarwiniaDelay) {
        setDelay(delay).then(() => {
            this.startSubmitToDarwinia();
        });
    }
}