import Relay from "../lib/relay";
import { log } from "../lib/utils";
import { queue } from "../lib/queue";
import { config } from "../cfg";

// get eth headers
async function getHeaders(headers: any[], block: number, blocksLimit: number) {
    if (headers.length >= 12) {
	log("eth header's storge larger than blocksLimit, wait 5 seconds for relaying");
	setTimeout(() => {
	    getHeaders.call(this, headers, block + 1, blocksLimit);
	}, 5000);

	return;
    }

    const header = await this.web3.eth.getBlock(block);
    log(`got new eth header ${header.hash}`);
    if (headers[0] === this.lastBlock) {
	headers = headers.slice(1);
	headers.push(header);
	this.header.container = headers[0];
    }

    await getHeaders.call(this, headers, block + 1, blocksLimit);
}

// main
(async function() {
    // use the relay seed
    config.sudo = config.relaySeed;

    // set relay service
    const relay = new Relay(config);
    relay.relayService = true;
    await relay.init();

    // async process, fix this array's length to double times
    // of blocksSafe.
    //
    // if the blocksSafe is 0, the value will be lucky 7.
    const blocksLimit = relay.blocksSafe != 0 ?
	relay.blocksSafe * 2 : 7;
    const headers: any[] = [];

    // async without await
    let bestHeaderHash = await relay.api.query.ethRelay.bestHeaderHash();
    log(`the hash of the current eth header is ${bestHeaderHash}`);
    bestHeaderHash = bestHeaderHash.toString();

    // get the last eth block in darwinia
    const currentBlock = await relay.web3.eth.getBlock(bestHeaderHash);
    relay.lastBlock = currentBlock;

    getHeaders.call(relay, headers, relay.lastBlock.height + 1, blocksLimit);

    // relay process
    queue.call(relay, 6);
})();
