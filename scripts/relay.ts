/* eslint-disable */
import Keyring from "@polkadot/keyring";
import { log, Logger } from "./lib/utils";
import { ApiPromise, WsProvider } from "@polkadot/api";

const chalk = require("chalk");
const prompts = require("prompts");
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
        log(`reset header succeed! 📦`, Logger.Success);
        log(`the tx hash of reset is ${hash}`);
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
        log(`relay header succeed! 🎉`, Logger.Success);
        log(`the tx hash of relay is ${hash}`);
    }

    /** step-3
     *  
     * redeem our ring 
     *
     */
    async redeem() {
        const ex = this.api.tx.ethBacking.redeem(customizeType.Ring);
        const hash = await ex.signAndSend(
            this.account
        ).catch(() => log("redeem receipt failed!", Logger.Error));
        log(`redeem receipt succeed! 🍺`, Logger.Success);
        log(`the tx hash of redeem is ${hash}`);
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
        log(`now we own ${account.data.free_ring} RING 💰`, Logger.Success);
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
    const res = await prompts({
        type: 'select',
        name: 'value',
        message: 'Test which process?',
        choices: [
            { title: 'All', description: 'Test all process, including ["genesis header", "relay header" and "redeem"]', value: 0 },
            { title: 'Get Balances', description: 'Get balances in current account', value: 1 },
            { title: 'Genesis header', description: 'init or reset genesis header', value: 2 },
            { title: 'Relay header', description: "Relay new header to darwinia, Note: this will panic if you haven't init header", value: 3 },
            { title: 'Redeem', description: "redeem balances from darwinia", value: 4 },
        ],
        initial: 0,
    }, {
        onCanceled: () => process.exit(0),
    });

    let relay = new Relay();
    await relay.init();

    switch (res.value) {
        case 0:
            await relay.reset();
            await relay.relay();
            await relay.getBalance();
            await relay.redeem();
            break;
        case 1:
            await relay.getBalance();
            break;
        case 2:
            await relay.reset();
            break;
        case 3:
            await relay.relay();
            break;
        case 4:
            await relay.redeem();
            break;
        default:
            process.exit(0);
    }

    // end process
    log("congratulation! the relay process has just launched at the Mars 🚀", Logger.Success);
    process.exit(0);
})();
