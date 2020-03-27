/* eslint-disable */
import Keyring from "@polkadot/keyring";
import { log, Logger, parseHeader, st } from "./lib/utils";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { setInterval } from "timers";

const prompts = require("prompts");
const customizeType = require("./types.json");
const { headers, receipt } = require("./headers.json");

enum Event {
    GetBalance,
    Reset,
    Relay,
    Redeem,
}

interface Queue {
    active: boolean;
    events: Event[]; // event queue
    success: boolean; // if succeed
    finished: boolean;  // if process finished
}

class Relay {
    account: any;
    api: any;
    queue: Queue;

    /** step-1
     *
     * reset server
     *
     */
    async reset() {
        const ex = this.api.tx.ethRelay.resetGenesisHeader(
            parseHeader(headers[0]), headers[0].totalDifficulty
        );
        await st.call(this, ex, "reset genesis block failed!");
    }

    /** step-2
     * 
     *  relay a new header that contains an exists darwinia tx.
     *
     *  Note: If you want to test sending tx to Ethereum, please checkout "./crash.ts".
     */
    async relay() {
        const ex = this.api.tx.ethRelay.relayHeader(parseHeader(headers[1]));
        await st.call(this, ex, "relay header failed!");
    }

    /** step-3
     *  
     * redeem our ring 
     *
     */
    async redeem() {
        const ex = this.api.tx.ethBacking.redeem({ "Ring": receipt });
        await st.call(this, ex, "redeem receipt failed!");
    }

    /** bonus-1
     *
     *  get balance
     *
     */
    async getBalance() {
        const account = await this.api.query.system.account(this.account.address).catch(
            () => log("relay header failed!", Logger.Error)
        );
        log(`now we own ${account.data.free_ring} RING 💰`, Logger.Success);

        this.queue.active = false;
        this.queue.finished = true;
    }

    /** bonus-2 
     *
     * listener
     *
     */
    async listen(strategy: number) {
        await log("init darwinia account 🧙‍♂️", Logger.Success);

        switch (strategy) {
            case 1:
                this.queue.events.push(Event.GetBalance);
                break;
            case 2:
                this.queue.events.push(Event.Reset);
                break;
            case 3:
                this.queue.events.push(Event.Relay);
                break;
            case 4:
                this.queue.events.push(Event.Redeem);
                break;
            case 0:
                this.queue.events = [
                    Event.GetBalance,
                    Event.Reset,
                    Event.Relay,
                    Event.Redeem,
                ];
                break;
            default:
                process.exit(0);
        }


        let interval = setInterval(() => {
            //  return if queue is active
            if (this.queue.active) {
                return;
            }

            // move to next event if current event finished
            if (this.queue.finished) {
                switch (this.queue.events[0]) {
                    case Event.Reset:
                        log(`reset header succeed! 📦`, Logger.Success);
                        break;
                    case Event.Relay:
                        log(`relay header succeed! 🎉`, Logger.Success);
                        break;
                    case Event.Redeem:
                        log(`redeem receipt succeed! 🍺`, Logger.Success);
                        break;
                    default:
                        break;
                }

                this.queue.active = true;
                this.queue.finished = false;
                this.queue.events = this.queue.events.slice(1);
            }

            // exit process if are events are finished
            if (this.queue.events.length === 0) {
                if (this.queue.success) {
                    clearInterval(interval);
                    log(
                        "congratulation! the relay process has just launched at the Mars 🚀",
                        Logger.Success
                    );
                    process.exit(0);
                } else {
                    process.exit(1);
                }
            }

            // exec event
            this.queue.active = true;
            switch (this.queue.events[0]) {
                case Event.GetBalance:
                    this.getBalance();
                    break;
                case Event.Reset:
                    this.reset();
                    break;
                case Event.Relay:
                    this.relay();
                    break;
                case Event.Redeem:
                    this.redeem();
                    break;
                default:
                    break;
            }
        }, 500);
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
            // provider: new WsProvider("ws://35.234.33.88:9944"),
        });

        this.account = new Keyring({ type: "sr25519" }).addFromUri(
            "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a" // dev //Alice
        );

        this.queue = {
            active: false,
            events: [],
            success: true,
            finished: false,
        }
    }
}

// main
(async function() {
    // prompts
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

    relay.listen(res.value);
})();
