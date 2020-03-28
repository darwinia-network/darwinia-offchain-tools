/* eslint-disable */
import Keyring from "@polkadot/keyring";
import { log, Logger, parseHeader, st } from "./lib/utils";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { setInterval } from "timers";

const prompts = require("prompts");
const customizeType = require("./types.json");
const { headers, receipt } = require("./headers.json");

// darwinia backend addr
const HOLDER = "0xd7b504ddbe25a05647312daa8d0bbbafba360686241b7e193ca90f9b01f95faa";

enum Event {
    GetBalance,
    Reset,
    Relay,
    Redeem,
    Transfer,
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
        st.call(this, ex, "reset genesis block failed!");
    }

    /** step-2
     * 
     *  relay a new header that contains an exists darwinia tx.
     *
     *  Note: If you want to test sending tx to Ethereum, please checkout "./crash.ts".
     */
    async relay() {
        const ex = this.api.tx.ethRelay.relayHeader(parseHeader(headers[1]));
        st.call(this, ex, "relay header failed!");
    }

    /** step-3
     *  
     * redeem our ring 
     *
     */
    async redeem() {
        const ex = this.api.tx.ethBacking.redeem({ "Ring": receipt });
        st.call(this, ex, "redeem receipt failed!");
    }

    /** bonus-0
     *
     *  transfer balance
     *
     */
    async transfer(addr = HOLDER, amount = 9999) {
        const ex = this.api.tx.balances.transfer(addr, amount);
        st.call(this, ex, "transfer failed!");
    }

    /** bonus-1
     *
     *  get balance
     *
     */
    async getBalance() {
        const account = await this.api.query.system.account(this.account.address).catch(
            () => log("get balance failed!", Logger.Error)
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
    listen(strategy: number) {
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
                    case Event.Transfer:
                        log("transfer 9999 RING to the contract holder");
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
                    log("get balance", Logger.EventMsg);
                    this.getBalance();
                    break;
                case Event.Reset:
                    log("reset genesis header", Logger.EventMsg);
                    this.reset();
                    break;
                case Event.Relay:
                    log("relay header", Logger.EventMsg);
                    this.relay();
                    break;
                case Event.Redeem:
                    log("redeem", Logger.EventMsg);
                    this.redeem();
                    break;
                case Event.Transfer:
                    log("transfer", Logger.EventMsg);
                    this.transfer();
                    break;
                default:
                    break;
            }
        }, 500);
    }

    /** init Relay account
     *
     * @sudo: root account that can reset header
     *
     */
    async init(
        sudo = "//Alice",
        addr = "ws://0.0.0.0:9944",
    ) {
        this.api = await ApiPromise.create({
            types: customizeType,
            provider: new WsProvider(addr),
        });

        // add seed
        this.account = new Keyring({ type: "sr25519" }).addFromUri(sudo);
        log("init darwinia account 🧙‍♂️", Logger.Success);

        // queue data
        this.queue = {
            active: false,
            events: [],
            success: true,
            finished: false,
        }

        // transfer to the contract holder
        let holder = await this.api.query.system.account(HOLDER);
        if (holder.data.free_ring.toString() === "0") {
            this.queue.events = [Event.GetBalance, Event.Transfer];
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
