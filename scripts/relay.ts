/* eslint-disable */
import Keyring from "@polkadot/keyring";
import { log, Logger } from "./lib/utils";
import { ApiPromise, WsProvider } from "@polkadot/api";

const chalk = require("chalk");
const readline = require("readline");
const customizeType = require("./types.json");
const { headers, receipt } = require("./headers.json");

class Relay {
    account: any;
    api: any;

    /** step-1
     *
     * reset server
     *
     */
    async reset() {
        const ex = this.api.tx.ethRelay.resetGenesisHeader(headers[0], headers[0].totalDifficulty);
        const hash = await ex.signAndSend(
            this.account
        ).catch(() => log("reset genesis block failed!", Logger.Error));
        log(`reset genesis block succeed! the tx hash is ${hash} `);
    }

    /** step-2
     * 
     *  relay a new header that contains an exists darwinia tx.
     *
     *  Note: If you want to test sending tx to Ethereum, please checkout "./crash.ts".
     */
    async relay() {
        const ex = this.api.tx.ethRelay.relayHeader(headers[1]);
        const hash = await ex.signAndSend(
            this.account
        ).catch(() => log("relay header failed!", Logger.Error));
        log(`relay new header succeed! the tx hash is ${hash}`);
    }

    /** step-3
     *  
     * redeem our ring 
     *
     */
    async redeem() {
        await this.getBalance();

        console.log(receipt);
        const ex = this.api.tx.ethBacking.redeem(receipt);
        const hash = await ex.signAndSend(
            this.account
        ).catch(() => log("redeem receipt failed!", Logger.Error));
        log(`redeem receipt succeed! the tx hash is ${hash}`);

        await this.getBalance();
    }

    /** utils-1
     *
     *  get balance
     *
     */
    async getBalance() {
        const account = await this.api.query.system.account(this.account.address).catch(
            () => log("relay header failed!", Logger.Error)
        );
        log(`${account.toString()}`);
    }

    /**
     *
     * init Relay account
     *
     */
    async init() {
        this.api = await ApiPromise.create({
            types: customizeType,
            provider: new WsProvider("ws://0.0.0.0:9944"),
        });

        this.account = new Keyring({ type: "sr25519" }).addFromUri(
            "0xb5de7ca0500e35394629d4ae4e0396f340f864042299713a07af14bcbc4d3dd0"
        );

        readline.cursorTo(process.stdout, 0, 1);
        readline.clearScreenDown(process.stdout);

        log("init darwinia account 🧙‍♂️");
    }
}

// main
(async function() {
    let relay = new Relay();
    await relay.init();

    // step-1: reset
    await relay.reset();

    // step-2: relay
    await relay.relay();

    // step-3: reedem
    // await relay.redeem();

    // end process
    log("congratulation! the relay process has just launched the Mars 🚀", Logger.Success);
    process.exit(0);
})();
