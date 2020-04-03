import * as https from "https";
import customizeType from "./json/types.json";
import Keyring from "@polkadot/keyring";
import Web3 from "web3";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Event, IQueue, IConfig } from "./types";
import { headers, receipt } from "./json/headers.json";
import { burn, Logger, log, parseHeader } from "./utils";

export interface IHeaders {
    genesis: any;            // genesis header
    container: any;          // the header contains our tx
    receipt: any;            // the receipt proof of darwinia
    receiptHash: any;        // the receipt hash of burn cotract
}

class API {
    public api: any;
    public web3: any;
    // darwinia account
    public account: any;
    // relay config
    public config: IConfig;
    // queue status
    public queue: IQueue;
    // receipt, container and genesis header suite.
    public headers: IHeaders;

    constructor(config: IConfig) {
        this.config = config;

        // use default headers
        if (!this.config.dynamic) {
            this.headers = {
                genesis: headers[0],
                container: headers[1],
                receipt,
                receiptHash: "",
            };
        }
    }

    /** step-1
     *
     * reset server
     *
     **/
    public reset() {
        const ex = this.api.tx.ethRelay.resetGenesisHeader(
            parseHeader(this.headers.genesis), this.headers.genesis.totalDifficulty,
        );
        this.st(ex, "reset genesis block failed!");
    }

    /** step-2
     *
     *  relay a new header that contains an exists darwinia tx.
     *
     *  Note: If you want to test sending tx to Ethereum, please checkout "./crashq.ts".
     *
     **/
    public relay() {
        const ex = this.api.tx.ethRelay.relayHeader(this.headers.container);
        this.st(ex, "relay header failed!");
    }

    /** step-3
     *
     * redeem our ring
     *
     **/
    public redeem() {
        const ex = this.api.tx.ethBacking.redeem({
            Ring: this.headers.receipt,
        });
        this.st(ex, "redeem receipt failed!");
    }

    /** darwinia-0
     *
     *  transfer balance
     *
     **/
    public transfer() {
        const ex = this.api.tx.balances.transfer(this.config.holder, 9999999999999);
        this.st(ex, "transfer failed!");
    }

    /** darwinia-1
     *
     *  get balance
     *
     **/
    public async getBalance() {
        const account = await this.api.query.system.account(this.account.address).catch(
            () => log("get balance failed!", Logger.Error),
        );

        log(`now we own ${account.data.free_ring} RING 💰`, Logger.Success);
        this.queue.active = false;
    }

    /** darwinia-2
     *
     * get receipt from darwinia baking
     *
     **/
    public getReceipt() {
        const url = "https://alpha.evolution.land/api/darwinia/receipt?tx=";
        https.get(url + this.headers.receiptHash, (res: any) => {
            if (res.statusCode !== 200) {
                log("get receipt from darwinia backing failed", Logger.Error);
            }

            let rawData = "";
            res.on("data", (chunk: any) => { rawData += chunk; });
            res.on("end", () => {
                try {
                    const receipt = JSON.parse(rawData).data;
                    if (receipt.proof.length < 20) {
                        return this.getReceipt();
                    }

                    this.headers.receipt = receipt;
                    this.queue.active = false;
                } catch (e) {
                    log("get receipt failed", Logger.Error);
                }
            });
        });
    }

    /** web3-1
     *
     * burn, send tx
     *
     **/
    public sendTx() {
        const addr = this.web3.eth.accounts.wallet[0].address;
        const contract = burn(this.web3, addr);

        log("this might take a long time, you can walk around and take a cup of coffee...");
        log("do not try to use proxy if you are testing a local darwinia node : )");

        contract.send({
            from: addr,
            gas: 500000,
        }).on("transactionHash", (hash: string) => {
            log(`our tx hash is ${hash}`);
        }).on("receipt", (r: any) => {
            this.headers.receiptHash = r.transactionHash;
            this.queue.active = false;
        }).on("error", () => {
            log([
                "send redeem request to eth contract failed, please make sure ",
                "you have enough ether and ring in your ethereum account. if you",
                "haven't change the default eth account, check the default one: ",
                "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318 ",
                "if it has any eth and ring left.\n\n",
                "if you think this is a bug, please raise an issue at: ",
                "https://github.com/darwinia-network/darwinia-offchain-tools/issues/new"
                ,].join(""), Logger.Error);
        });
    }

    /** web3-2
     *
     * get container header from darwinia baking
     *
     **/
    public async getContainerHeader() {
        this.headers.container = parseHeader(await this.web3.eth.getBlock(
            this.headers.receipt.header_hash,
        ).catch(() => {
            log("get container block header failed", Logger.Error);
        }));
        this.queue.active = false;
    }

    /** web3-3
     *
     * get container header from darwinia baking
     *
     **/
    public async getGenesisHeader() {
        this.headers.genesis = parseHeader(await this.web3.eth.getBlock(
            this.headers.container.number - 1,
        ).catch(() => {
            log("get genesis block header failed", Logger.Error);
        }));
        this.queue.active = false;
    }

    /** init Relay account
     *
     * pre-init for the tests
     *
     **/
    public async init() {
        // set darwinia api
        this.api = await ApiPromise.create({
            types: customizeType,
            provider: new WsProvider(this.config.addr),
        });

        // set web3
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.web3));
        this.web3.eth.accounts.wallet.add(this.config.priv);

        // add seed
        this.account = new Keyring({ type: "sr25519" }).addFromUri(this.config.sudo);
        log("init darwinia account 🧙‍♂️", Logger.Success);

        // queue data
        this.queue = {
            active: false,
            events: [],
            success: true,
        };

        // transfer to the contract holder
        const holder = await this.api.query.system.account(this.config.holder);
        if (holder.data.free_ring.toString() === "0") {
            this.queue.events = this.queue.events.concat([
                Event.GetBalance, Event.Transfer,
            ]);
        }
    }

    /** utils-1
     *
     * sign and send
     *
     */
    private st(ex: any, err: string) {
        ex.signAndSend(
            this.account, {}, (r: any) => {
                try {
                    log.call(this, r, Logger.Event);
                } catch (_) {
                    log(err, Logger.Error);
                }
            },
        ).catch(() => log(err, Logger.Error));
    }
}

// export relay
export default API;
