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
    // relay lock
    public lock: boolean;
    // next block
    public next: any;
    // relay apis
    public relay: API;
    // config
    protected config: IConfig;

    constructor(config: IConfig) {
        super();
        config.sudo = config.relaySeed;

        this.next = null;
        this.lock = false;
        this.relay = new API(config);
        this.fetcher = new Fetcher(config);
    }

    public async start(): Promise<void> {
        await this.relay.init();
        await this.startFromBestHeaderHash();

        // set safe block, if it is zero use lucky 7 or safe * 2 in darwinia
        let safe: number = await this.relay.api.query.ethRelay.numberOfBlocksSafe();
        safe = safe === 0 ? 7 : safe * 2;

        // start relay queue
        this.interval = setInterval(async () => {
            if (this.lock || this.next === null) {
                return;
            }

            if (
                this.fetcher.max >= this.next.number + safe ||
                (this.fetcher.max - this.fetcher.count) <= this.next.number
            ) {
                await this.fetcher.stop();
            } else if (
                this.fetcher.max <= this.next.number + safe / 3 &&
                this.fetcher.status() === false
            ) {
                await this.fetcher.start(this.next.number);
            }

            this.relayNext();
        }, 1000);
    }

    public async stop(): Promise<void> {
        clearInterval(this.interval);
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

        // get last block from web3
        log("fetching the last eth block in darwinia from ethereum...", Logger.EventMsg);
        const lastBlock = await this.relay.web3.eth.getBlock(bestHeaderHash.toString()).catch(
            (e: any) => {
                log(e, Logger.Warn);
            },
        );

        if (lastBlock === null) {
            log([
                "get last block failed, please make sure that ",
                "you have reset the genesis eth header",
            ].join(""), Logger.Error);
        }

        log(`got last eth block ${lastBlock.number} from ethereum`);
        this.next = lastBlock;
        await this.getNextBlock();
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
                    await this.fetcher.start(lastBlock.number);
                }

                tried += 1;
                log("get block failed, wait 10s for fetcher process...", Logger.Warn);
                next = await this.fetcher.getBlock(lastBlock.number + 1);

                if (next !== null && next !== undefined) {
                    this.next = next;
                    clearInterval(retry);
                }
            }, 10000);
        }

        this.next = next;
    }

    /**
     *
     * relay the next eth block
     *
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
                        await this.startFromBestHeaderHash();
                    }
                });
            } else if (status.isFinalized) {
                log(`Finalized block hash: ${status.asFinalized.toHex()}`);
                if (succeed) {
                    log(`relay block ${this.next.number}`, Logger.Success);
                    await this.getNextBlock();
                }
                this.lock = false;
            }
        }).catch(async () => {
            log("transaction failed, sleep for 3s and try again", Logger.Warn);
            await new Promise(() => setTimeout(() => {
                this.relayNext();
            }, 3000));
        });
    }
}

export default RelayService;
