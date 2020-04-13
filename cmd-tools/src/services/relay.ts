/**
 * could not re-use the relay part from /lib/relay.ts, because this
 * service need to restart manualy when error occurs instead of
 * exiting process.
 */
import { IConfig } from "../types";
import { log, Logger } from "../utils";

import API from "../api";
import Fetcher from "./fetcher";
import Service from "./service";

class RelayService extends Service {
    // fetcher service
    public fetcher: Fetcher;
    // interval
    public interval: any;
    // stopInterval
    public stopInterval: any;
    // relay lock
    public lock: boolean;
    // next block
    public next: any;
    // relay apis
    public relay: API;
    // config
    protected config: IConfig;
    // safe block
    private safe: number;

    constructor(config: IConfig) {
        super();
        config.sudo = config.relaySeed;

        this.next = null;
        this.lock = false;
        this.relay = new API(config);
        this.fetcher = new Fetcher(config);
    }

    /**
     * start relay service
     */
    public async start(): Promise<void> {
        await this.relay.init().catch((e: any) => {
            log(e, Logger.Warn);
            log("polkadot.js init failed, please check your network", Logger.Error);
        });
        await this.startFromBestHeaderHash().catch((e: any) => {
            log(e, Logger.Warn);
            log([
                "get best header hash from darwinia failed, ",
                "please check your network",
            ].join(""), Logger.Error);
        });

        // set safe block, if it is zero use lucky 7 or safe * 2 in darwinia
        this.safe = await this.relay.api.query.ethRelay.numberOfBlocksSafe().catch(
            (e: any) => {
                log(e, Logger.Warn);
                log([
                    "get safe block from darwinia failed, ",
                    "please check your network connection",
                ], Logger.Error);
            },
        );

        await this.setInvervals();
    }

    /**
     * stop relay service
     */
    public async stop(): Promise<void> {
        clearInterval(this.interval);
        clearInterval(this.stopInterval);
    }

    /**
     * interval sets
     * @description - A stand-alone async method to make requests in order
     */
    private async setInvervals() {
        log("set eth-relay intervals...", Logger.EventMsg);

        // if there is no safe block. default to 7
        if (
            this.safe === 0 ||
                this.safe === undefined ||
                this.safe === null
        ) {
            this.safe = 7;
        } else {
            this.safe *= 2;
        }

        // stop interval, this should work parallel with the relay interval
        // because that one has block calls
        this.stopInterval = setInterval(async () => {
            if (this.next === null || this.next === undefined) {
                return;
            }

            if (
                (this.fetcher.max >= this.next.number + this.safe ||
                    (this.fetcher.max - this.fetcher.count) <= this.next.number) &&
                    this.fetcher.status()
            ) {
                log(`safe-height: ${this.safe}`);
                log(`fetcher-max: ${this.fetcher.max}`);
                log(`darwinia-height: ${this.next.number}`);
                await this.fetcher.stop().catch((e: any) => {
                    log(e, Logger.Warn);
                    log("stop fetcher failed, try after 1s...", Logger.Error);
                });
            }
        }, 500);

        // start relay queue
        this.interval = setInterval(async () => {
            if (this.lock || this.next === null || this.next === undefined) {
                return;
            }

            if (
                this.fetcher.max <= this.next.number + this.safe / 3 &&
                this.fetcher.status() === false
            ) {
                await this.fetcher.start(this.next.number).catch((e: any) => {
                    log(e, Logger.Warn);
                    log("start fetcher failed, try after 1s...", Logger.Error);
                });
            }

            this.relayNext();
        }, 1000);
    }

    /**
     * get ethereum block by number or string, with logs
     * @param block number | string
     */
    private async getBlock(block: number | string): Promise<any> {
        // get last block from web3
        log("fetching the last eth block in darwinia from ethereum...", Logger.EventMsg);
        const lastBlock = await this.relay.web3.eth.getBlock(block).catch(
            (e: any) => {
                log(e, Logger.Warn);
            },
        );

        if (lastBlock === null || lastBlock === undefined) {
            log([
                "get last block failed, please make sure that ",
                "there is a genesis eth header in darwinia",
            ].join(""), Logger.Error);
        }

        log(`got eth block ${lastBlock.number} from ethereum`);
        return lastBlock;
    }

    /**
     * start relay from BestHeaderHash in darwinia, this function has two
     * usages:
     *
     * - first start this process
     * - restart this process from error
     */
    private async startFromBestHeaderHash(): Promise<void> {
        // get last block hash from darwinia
        const bestHeaderHash = await this.relay.api.query.ethRelay.bestHeaderHash().catch(
            (e: any) => {
                log(e, Logger.Warn);
            },
        );

        const lastBlock = await this.getBlock(bestHeaderHash.toString());

        // start next loop
        this.next = lastBlock;
        await this.getNextBlock().catch((e: any) => {
            log(e, Logger.Warn);
        });
    }

    /**
     * get next block from fetcher
     */
    private async getNextBlock() {
        let tried = 0;
        const lastBlock = this.next;
        let next = await this.fetcher.getBlock(lastBlock.number + 1);
        if (next === null || next === undefined) {
            const retry = setInterval(async () => {
                if (tried >= 10) {
                    log([
                        "tried too many times, please check your network first",
                        "if it is okay, check the fetcher process or raise an ",
                        "issue at: ",
                        "https://github.com/darwinia-network/darwinia-offchain-tools/issues/new",
                    ], Logger.Error);
                }

                if (!this.fetcher.status()) {
                    await this.fetcher.start(lastBlock.number).catch((e: any) => {
                        log(e, Logger.Warn);
                    });
                }

                tried += 1;
                log("get block failed, wait 10s for fetcher process...", Logger.Warn);
                next = await this.fetcher.getBlock(lastBlock.number + 1).catch((e: any) => {
                    log(e, Logger.Warn);
                });

                if (next !== null && next !== undefined) {
                    this.next = next;
                    clearInterval(retry);
                }
            }, 10000);
        }

        this.next = next;
    }

    /**
     * relay the next eth block
     */
    private relayNext() {
        this.lock = true;
        let succeed = true;

        log(`relay block ${this.next.number} to darwinia...`, Logger.EventMsg);

        const ex = this.relay.api.tx.ethRelay.relayHeader(this.next);
        ex.signAndSend(this.relay.account, {}, async (res: any) => {
            const status = res.status;
            log(`Transaction status: ${status.type}`);

            if (status.isInBlock) {
                log(`Included at block hash: ${status.asInBlock.toHex()}`);
                if (res.events === undefined) {
                    return;
                }

                res.events.forEach(async (r: any) => {
                    log(
                        "\t" +
                        r.phase.toString() +
                        `: ${r.event.section}.${r.event.method}` +
                        r.event.data.toString(),
                    );

                    if (r.event.data[0].isModule) {
                        const doc = await this.relay.api.registry.findMetaError(
                            r.event.data[0].asModule,
                        );
                        const err = `${doc.name}.${doc.section} - ${doc.documentation.join(" ")}`;
                        log(err, Logger.Warn);

                        succeed = false;
                        await this.startFromBestHeaderHash().catch((e: any) => {
                            log(e, Logger.Warn);
                        });
                    }
                });
            } else if (status.isFinalized) {
                log(`Finalized block hash: ${status.asFinalized.toHex()}`);
                if (succeed) {
                    // sometimes the process not sync
                    if (this.next && this.next.number) {
                        log(`relay block ${this.next.number}`, Logger.Success);
                    }
                    await this.getNextBlock().catch((e: any) => {
                        log(e, Logger.Warn);
                    });
                }
                this.lock = false;
            }
        }).catch(async () => {
            log("transaction failed, sleep for 3s and try again", Logger.Warn);
            await new Promise(async () => setTimeout(async () => {
                this.relayNext();
            }, 3000)).catch((e: any) => {
                log(e, Logger.Warn);
            });
        });
    }
}

export default RelayService;
