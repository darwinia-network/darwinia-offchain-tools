#!/usr/bin/env ts-node

import API from "../../api";
import { log, Logger } from "../../utils";
import config from "../../../cfg";

(async () => {
    if (process.argv.length < 3) {
        console.log("usage: ./relay <height>/<hash>");
        process.exit(0);
    }

    // get the target block
    const block = process.argv[2];

    // init api
    let api = new API(config);
    await api.init();

    // set the relay block
    api.queue.active = true;
    api.headers.container = await api.web3.eth.getBlock(block);
    log(`fetching the ${block} from infura...`);

    // relay header
    api.relay();
    log(`relay header`, Logger.EventMsg);

    // exit process
    setInterval(() => {
        if (api.queue.active === false && api.queue.success) {
            log(`relay header succeed!`, Logger.Success);
            process.exit(0);
        }
    }, 500)
})();
