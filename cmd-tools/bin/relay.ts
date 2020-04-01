/**
 * could not re-use the relay part from /lib/relay.ts, because this
 * service need to restart when error occurs instead of exiting process.
 */
import Relay from "../lib/relay";
import { config } from "../cfg";
import { log, Logger } from "../lib/utils";
import { getBlock, fetcher } from "../lib/fetcher";

// shared mutable args
interface Share {
    // next block
    next: any,
    // relay lock
    lock: boolean,
    // relay apis
    relay: Relay
}

async function getNextBlock() {
    let tried = 0;
    let lastBlock = this.next;
    let next = await getBlock(lastBlock.number + 1);
    if (next === false || next === undefined) {
        let retry = setInterval(async () => {
            if (tried >= 10) {
                log("tried too many times, please check the fetcher process", Logger.Error);
            }

            tried += 1;
            log("get block failed, wait 5s for fetcher process...", Logger.Warn);
            next = await getBlock(lastBlock.number + 1);

            if (next != false && next != undefined) {
                this.next = next;
                clearInterval(retry);
            }
        }, 5000)
    }

    this.next = next;
}

// start relay from BestHeaderHash in darwinia, this function has two
// usages:
//
// - first start this process
// - restart this process from error
async function startFromBestHeaderHash(): Promise<void> {
    // get last block hash from darwinia
    const bestHeaderHash = await this.relay.api.query.ethRelay.bestHeaderHash().catch(
        (e: any) => {
            log(e, Logger.Warn);
        }
    );

    // get last block from web3
    log("fetching the last eth block in darwinia from ethereum...", Logger.EventMsg);
    const lastBlock = await this.relay.web3.eth.getBlock(bestHeaderHash.toString()).catch(
        (e: any) => {
            log(e, Logger.Warn);
        }
    );

    if (lastBlock === null) {
        log([
            "get last block failed, please make sure that ",
            "you have reset the genesis eth header"
        ].join(""), Logger.Warn);
    }

    this.next = lastBlock;
    await getNextBlock.call(this);
}

/** relay the next eth block
 *
 * @this: Share
 *
 */
function relayNext() {
    this.lock = true;
    let succeed = true;

    log(`relay block ${this.next.number} to darwinia...`, Logger.EventMsg);

    const ex = this.relay.api.tx.ethRelay.relayHeader(this.next);
    ex.signAndSend(this.relay.account, {}, async (res: any) => {
        const status = res.status;
        log(`Transaction status: ${status.type}`);

        if (status.isInBlock) {
            log(`Included at block hash: ${status.asInBlock.toHex()}`);
            res.events && res.events.forEach(async (r: any) => {
                log(
                    "\t" +
                    r.phase.toString() +
                    `: ${r.event.section}.${r.event.method}` +
                    r.event.data.toString()
                );

                if (r.event.data[0].isModule) {
                    const doc = await this.relay.api.registry.findMetaError(
                        r.event.data[0].asModule
                    );
                    const err = `${doc.name}.${doc.section} - ${doc.documentation.join(" ")}`;
                    log(err, Logger.Warn);

                    succeed = false;
                    await startFromBestHeaderHash.call(this);
                }
            });
        } else if (status.isFinalized) {
            log(`Finalized block hash: ${status.asFinalized.toHex()}`);
            if (succeed) {
                log(`relay block ${this.next.number}`, Logger.Success);
                await getNextBlock.call(this);
            }
            this.lock = false;
        }
    });
}


// main
(async function() {
    config.sudo = config.relaySeed;
    const relay = new Relay(config);

    // share args
    let share: Share = {
        next: null,
        relay: relay,
        lock: false,
    };

    await relay.init();
    await startFromBestHeaderHash.call(share);

    // start relay queue
    setInterval(() => {
        if (share.lock || !share.next) return;
        relayNext.call(share);
    }, 1000);
})();
