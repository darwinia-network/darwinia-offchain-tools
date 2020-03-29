/* eslint-disable */
import burn from "./lib/burn";
import Keyring from "@polkadot/keyring";
import Web3 from "web3";
import { Config, config } from "./cfg";
import { log, Logger, parseHeader, st } from "./lib/utils";
import { Event, Queue, Headers, queue } from "./lib/queue";
import { ApiPromise, WsProvider } from "@polkadot/api";

const https = require("https");
const prompts = require("prompts");
const customizeType = require("./lib/types.json");
const { headers, receipt } = require("./lib/headers.json");

class Relay {
    account: any;
    api: any;
    config: Config;
    queue: Queue;
    web3: any;
    headers: Headers;

    /** constructor
     *
     * construct relay with config
     *
     **/
    constructor(config: Config) {
        this.config = config;

        // use default headers 
        if (!this.config.dynamic) {
            this.headers = {
                genesis: headers[0],
                container: headers[1],
                receipt: receipt,
                currentHeight: 757576,
                receiptHash: "",
            }
        }
    }

    /** step-1
     *
     * reset server
     *
     **/
    reset() {
        const ex = this.api.tx.ethRelay.resetGenesisHeader(
            parseHeader(this.headers.genesis), this.headers.genesis.totalDifficulty
        );
        st.call(this, ex, "reset genesis block failed!");
    }

    /** step-2
     * 
     *  relay a new header that contains an exists darwinia tx.
     *
     *  Note: If you want to test sending tx to Ethereum, please checkout "./crash.ts".
     *
     **/
    relay() {
        const ex = this.api.tx.ethRelay.relayHeader(parseHeader(this.headers.container));
        st.call(this, ex, "relay header failed!");
    }

    /** step-3
     *  
     * redeem our ring 
     *
     **/
    redeem() {
        const ex = this.api.tx.ethBacking.redeem({ "Ring": this.headers.receipt });
        st.call(this, ex, "redeem receipt failed!");
    }

    /** bonus-0
     *
     *  transfer balance
     *
     **/
    transfer() {
        const ex = this.api.tx.balances.transfer(this.config.holder, 9999999999999);
        st.call(this, ex, "transfer failed!");
    }

    /** bonus-1
     *
     *  get balance
     *
     **/
    async getBalance() {
        const account = await this.api.query.system.account(this.account.address).catch(
            () => log("get balance failed!", Logger.Error)
        );
        log(`now we own ${account.data.free_ring} RING 💰`, Logger.Success);

        this.queue.active = false;
        this.queue.finished = true;
    }

    /** web3-1
     * 
     * burn, send tx
     *
     **/
    sendTx() {
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
            this.queue.finished = true;
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
            ].join(""), Logger.Error);
        });
    }

    /** web3-1
     *
     * get receipt from darwinia baking
     *
     **/
    getReceipt() {
        let url = "https://alpha.evolution.land/api/darwinia/receipt?tx=";
        https.get(url + this.headers.receiptHash, (res: any) => {
            if (res.statusCode !== 200) {
                log("get receipt from darwinia backing failed", Logger.Error);
            }

            let rawData = '';
            res.on('data', (chunk: any) => { rawData += chunk; });
            res.on("end", () => {
                try {
                    let receipt = JSON.parse(rawData).data;
                    if (receipt.proof.length < 20) {
                        return this.getReceipt();
                    }

                    this.headers.receipt = receipt;
                    this.queue.finished = true;
                    this.queue.active = false;
                } catch (e) {
                    log("get receipt failed", Logger.Error);
                }
            });
        });
    }

    /** web3-2
     *
     * get container header from darwinia baking
     *
     **/
    async getContainerHeader() {
        this.headers.container = await this.web3.eth.getBlock(
            this.headers.receipt.header_hash
        ).catch(() => {
            log("get container block header failed", Logger.Error);
        });
        this.queue.finished = true;
        this.queue.active = false;
    }

    /** web3-3
     *
     * get container header from darwinia baking
     *
     **/
    async getGenesisHeader() {
        this.headers.genesis = await this.web3.eth.getBlock(
            this.headers.container.number - 1
        ).catch(() => {
            log("get genesis block header failed", Logger.Error);
        });
        this.queue.finished = true;
        this.queue.active = false;
    }

    /** init Relay account
     *
     * pre-init for the tests
     *
     **/
    async init() {
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
            finished: false,
        }

        // transfer to the contract holder
        let holder = await this.api.query.system.account(this.config.holder);
        if (holder.data.free_ring.toString() === "0") {
            this.queue.events = this.queue.events.concat([
                Event.GetBalance, Event.Transfer
            ]);
        }
    }
}

// main
(async function() {
    const res = await prompts({
        type: 'select',
        name: 'value',
        message: 'Test which process?',
        choices: [
            { title: 'All', description: 'Test all process dynamic', value: 0 },
            { title: 'Get Balances', description: 'Get balances in current account', value: 1 },
            { title: 'Reset header', description: 'init or reset genesis header', value: 2 },
            { title: 'Relay header', description: "Relay a new header to darwinia", value: 3 },
            { title: 'Redeem', description: "redeem balances from darwinia", value: 4 },
        ],
        initial: 0,
    }, {
        onCanceled: () => process.exit(0),
    });

    let relay = new Relay(config);
    await relay.init();

    queue.call(relay, res.value);
})();
