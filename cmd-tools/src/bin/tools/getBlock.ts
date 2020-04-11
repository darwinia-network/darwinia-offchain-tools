#!/usr/bin/env ts-node

import config from "../../../cfg";
import Web3 from "web3";

(async () => {
    if (process.argv.length < 3) {
        console.log("usage: getBlock <number>/<height>");
        process.exit(0);
    }

    const block = process.argv[2];
    const web3 = new Web3(new Web3.providers.HttpProvider(config.web3));
    const res = await web3.eth.getBlock(block);

    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
})();
