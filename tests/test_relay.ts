import Config from "../src/ethereum/Config";
import { bootstrap } from "./bootstrap";
import Web3 from "web3";
import tx from "./tx";

async function main(): Promise<void> {
    // await bootstrap();

    // const web3 = new Web3(new Web3.providers.HttpProvider(Config.network as string));
    // const api = Config.polkadotApi;

    await tx();
    // web3.eth.accounts.wallet.add(
    //     "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318"
    // );
    // console.log(web3.eth.accounts.wallet[0]);

    // let current = await api.query.ethRelay.genesisHeader();
    // console.log(current);
}

// main
(async function() {
    await main();
    // process.exit(0);
})();
