import Relay from "../lib/relay";
import { config } from "../cfg";
import { queue } from "../lib/queue";
import { log } from "../lib/utils";
import { getBlock } from "../lib/fetcher";

// main
(async function() {
    config.sudo = config.relaySeed;

    const relay = new Relay(config);
    await relay.init();
    relay.relayService = true;

    // get last block
    const bestHeaderHash = await relay.api.query.ethRelay.bestHeaderHash();
    const lastBlock = await relay.web3.eth.getBlock(bestHeaderHash.toString());
    relay.headers.container = await getBlock(lastBlock.number + 1);

    // start relay queue
    log(`start relay from ${lastBlock.number + 1}`);
    queue.call(relay, 6);

    // let block = await getBlock(7575767);
    // console.log(block);
})();
