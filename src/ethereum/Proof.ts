/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/camelcase */
import { bufferToU8a, u8aToHex, hexToU8a } from "@polkadot/util";
import { rlp } from "ethereumjs-util";
import Web3 from "web3";
import { BlockNumber } from "web3-core";
import Config from "./Config";
import logger from "../util/logger";
import { setDelay } from "./Utils";
import process from "process";

export default class Proof {

    async getHeaderInfo(web3js: Web3, blockNumber: BlockNumber): Promise<any> {
        if (!blockNumber) return null;
        logger.info("start to get block number info: " + blockNumber);

        const block = await web3js.eth.getBlock(blockNumber).catch((e: Error) => {
            logger.error("web3js.eth.getBlock error, blockNumber is " + blockNumber + "\n ERRPR:" + e);
        });

        if (!block) return [null, null];

        logger.info("Successfully acquired the block number info: " + blockNumber);

        // @ts-ignore
        const mixh = bufferToU8a(rlp.encode(block.mixHash));
        const nonce = bufferToU8a(rlp.encode(block.nonce));
        const seal = [u8aToHex(mixh), u8aToHex(nonce)];

        const header = {
            parent_hash: block.parentHash,
            timestamp: block.timestamp,
            number: block.number,
            auth: block.miner,
            // @ts-ignore
            transaction_root: block.transactionsRoot,
            uncles_hash: block.sha3Uncles,
            extra_data: block.extraData,
            state_root: block.stateRoot,
            // @ts-ignore
            receipts_root: block.receiptsRoot,
            log_bloom: block.logsBloom,
            gas_used: block.gasUsed,
            gas_limit: block.gasLimit,
            difficulty: block.difficulty,
            seal: seal,
            hash: block.hash
        };
        return [header, block];
    }

    // @ts-ignore
    async createTx(extrinsic, account, blockNumber, callback): Promise<any> {
        if (!extrinsic) { throw "empty extrinsic"; };
       
        // @ts-ignore
        const hash = await extrinsic.signAndSend(account, ({ events = [], status }) => {

            if (status.isFinalized) {
                if (blockNumber) {
                    logger.info("Successful transfer of with hash " + status.asFinalized.toHex() + " blockNumber: " + blockNumber);
                } else {
                    logger.info("Successful extrinsic of with hash " + status.asFinalized.toHex());
                }
                // clearTimeout(timeout);
                
            } else {
                console.log("Status of transfer: " + status.type);
                if (status.type == "Invalid") {
                    // throw "extrinsic Invalid";
                    // clearTimeout(timeout);
                    // callback && callback("Invalid");
                }
            }
            // @ts-ignore
            events.forEach(({ phase, event: { data, method, section } }) => {
                console.log(phase.toString() + " : " + section + ".");
                if((section + "." + method) === "system.ExtrinsicSuccess") {
                    callback && callback(status.asFinalized.toHex());
                }
            });
        });

        console.log(hash);
    }

    async checkReceipt(header: string, proof: string, headerHash: string): Promise<any> {
        let ex: any = null;
        const api = Config.polkadotApi;
        if (!api) {
            logger.error("api is invalid");
            return "invalid";
        }
        const account = Config.KeyringAccountBob;
        ex = api.tx.ethRelay.checkReceipt({ index: header, proof, header_hash: headerHash });
        return new Promise(async (resolve, reject) => {
            await this.createTx(ex, account, null, (status: string) => {
                if (status == "Invalid") {
                    logger.error("createTx Error" + status);
                    reject("invalid");
                }
                resolve(status);
            }).catch((e: Error) => {
                logger.error("createTx Error" + e);
                reject("invalid");
            });
        });
    }

    async start(): Promise<any> {
        const web3js = Config.web3;
        const api = Config.polkadotApi;
        const account = Config.KeyringAccount;
        
        if (!Config.EthereumBlockNumberInNode) {
            Config.EthereumBlockNumberInNode = Config.EthereumBlockNumberInChain;
            this.scheduleStarter();
            return;
        }

        if(Config.EthereumBlockNumberInNode as number + Config.delayStep > Config.EthereumBlockNumberInChain){
            this.scheduleStarter();
            return;
        }

        const nextBlockNumber = parseInt(Config.EthereumBlockNumberInNode.toString()) + Config.blockStep;

        const [header, block] = await this.getHeaderInfo(web3js, nextBlockNumber).catch((e) => {
            logger.error(e);
        });

        if (!header || !block) {
            logger.error("header or block is empty");
            this.scheduleStarter();
            return;
        }

        let ex = null;
        let hasResetGenesisHeader = false;

        if (!Config.hasResetGenesisHeader) {
            logger.info("start build resetGenesisHeader extrinsic");
            ex = api.tx.ethRelay.resetGenesisHeader(header, block.totalDifficulty);
            hasResetGenesisHeader = true;
        } else {
            logger.info("start build relayHeader extrinsic");
            ex = api.tx.ethRelay.relayHeader(header);
        }
        try{
            await this.createTx(ex, account, nextBlockNumber, (status: string) => {
                if (status == "Invalid") {
                    logger.error("createTx Error" + status);
                    this.scheduleStarter();
                    return;
                }
                if (hasResetGenesisHeader) {
                    Config.hasResetGenesisHeader = true;
                }
                this.storageFinalizedBlockNumber(nextBlockNumber);
                Config.EthereumBlockNumberInNode = nextBlockNumber;
                this.scheduleStarter();
            }).catch((e: Error) => {
                logger.error("createTx Error" + e);
                this.scheduleStarter();
            });
        }catch(e){
            console.log("createTx timeout: ",e);
            this.scheduleStarter();
        };
        
    }

    private storageFinalizedBlockNumber(number: BlockNumber) {
        process.send({ finalizedBlockNumber: number});
    }

    private scheduleStarter(delay: number = Config.startSubmitToDarwiniaDelay) {
        setDelay(delay).then(() => {
            this.start();
        });
    }
}