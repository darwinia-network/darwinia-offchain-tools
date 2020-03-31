import Relay from "../lib/relay";
import { queue } from "../lib/queue";
import { config } from "../cfg";

// get eth headers
async function getHeaders(headers: any[], block: number) {
  const header = await this.web3.eth.getBlock(block);
  if (headers[0] === this.lastBlock) {
    headers = headers.slice(1);
    headers.push(header);
  } else {
    // restart process
    this.relayService = false;
    return;
  }

  await getHeaders(headers, block + 1);
}

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
  const headers = new Array(blocksLimit);
  headers.map(() => null);

  // async without await
  getHeaders(headers, relay.lastBlock.height + 1);

  // relay process
  queue.call(relay, 6);
})();
