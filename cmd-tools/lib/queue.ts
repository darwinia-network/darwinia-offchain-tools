import { log, Logger } from "./utils";

export enum Event {
    GetBalance,
    GetReceipt,
    GetContainerHeader,
    GetGenesisHeader,
    Reset,
    Relay,
    Redeem,
    SendTx,
    Transfer,
}

const TxFamily = [
    Event.SendTx,
    Event.GetReceipt,
    Event.GetContainerHeader,
    Event.GetGenesisHeader,
];

export interface Queue {
    active: boolean;
    events: Event[];     // event queue
    success: boolean;    // if succeed
}

export interface Headers {
    genesis: any;            // genesis header
    container: any;          // the header contains our tx
    receipt: any;            // the receipt proof of darwinia
    receiptHash: any;        // the receipt hash of burn cotract
}

/** Event queue
 *
 * @case-0: Test all process
 * @case-1: Reset genesis header
 * @case-2: Get balances in current account
 * @case-3: Relay a new header to darwinia
 * @case-4: Redeem balances from darwinia
 * @case-5: Relay with offchain worker
 * @case-6: Relay service
 *
 */
export async function queue(strategy: number) {
    switch (strategy) {
        case 1:
            this.queue.events = [Event.GetBalance];
            break;
        case 2:
            if (this.config.dynamic) {
                this.queue.events = this.queue.events.concat(TxFamily);
            }
            this.queue.events.push(Event.Reset);
            break;
        case 3:
            if (this.config.dynamic) {
                this.queue.events = this.queue.events.concat(TxFamily);
                this.queue.events.push(Event.Reset);
            }
            this.queue.events.push(Event.Relay);
            break;
        case 4:
            if (this.config.dynamic) {
                this.queue.events = this.queue.events.concat(TxFamily);
                this.queue.events.push(Event.Reset);
                this.queue.events.push(Event.Relay);
            }
            this.queue.events.push(Event.Redeem);
            break;
        case 0:
            this.queue.events = this.queue.events.concat(TxFamily);
            this.queue.events = this.queue.events.concat([
                Event.GetBalance,
                Event.Reset,
                Event.Relay,
                Event.Redeem,
            ]);
            break;
        default:
            process.exit(0);
    }

    const interval = setInterval(async () => {
        //  return if queue is active
        if (this.queue.active) {
            return;
        }

        // move to next event if current event finished
        switch (this.queue.events[0]) {
            case Event.SendTx:
                log("ethereum has received our tx!");
                break;
            case Event.GetReceipt:
                log(`\t${JSON.stringify(this.headers.receipt)}`);
                break;
            case Event.GetContainerHeader:
                log(`\t${JSON.stringify(this.headers.container)}`);
                break;
            case Event.GetGenesisHeader:
                log(`\t${JSON.stringify(this.headers.genesis)}`);
                break;
            case Event.Reset:
                log("reset header succeed! 📦", Logger.Success);
                break;
            case Event.Relay:
                log("relay header succeed! 🎉", Logger.Success);
                break;
            case Event.Redeem:
                log("redeem receipt succeed! 🍺", Logger.Success);
                break;
            case Event.Transfer:
                log("transfered 9999 RING to the contract holder");
                break;
            default:
                break;
        }

        this.queue.active = true;
        this.queue.events = this.queue.events.slice(1);

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
            case Event.SendTx:
                log("SendTx", Logger.EventMsg);
                this.sendTx();
                break;
            case Event.GetReceipt:
                log("GetReceipt", Logger.EventMsg);
                this.getReceipt();
                break;
            case Event.GetContainerHeader:
                log("GetContainerHeader", Logger.EventMsg);
                this.getContainerHeader();
                break;
            case Event.GetGenesisHeader:
                log("GetGenesisHeader", Logger.EventMsg);
                this.getGenesisHeader();
                break;
            case Event.GetBalance:
                log("GetBalance", Logger.EventMsg);
                this.getBalance();
                break;
            case Event.Reset:
                log("Reset", Logger.EventMsg);
                this.reset();
                break;
            case Event.Relay:
                log("Relay", Logger.EventMsg);
                this.relay();
                break;
            case Event.Redeem:
                log("Redeem", Logger.EventMsg);
                this.redeem();
                break;
            case Event.Transfer:
                log("Transfer", Logger.EventMsg);
                this.transfer();
                break;
            default:
                break;
        }
    }, 500);
}
