import Config from "../src/ethereum/Config";
import Web3 from "web3";

async function main(): Promise<void> {
    const web3 = new Web3(new Web3.providers.HttpProvider(Config.network as string));
    web3.eth.accounts.wallet.add(
        "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318"
    );

    const r = await web3.eth.getTransactionReceipt("0xc56be493f656f1c8222006eda5cd3392be5f0c096e8b7fb1c5542088c0f0c889");
    console.log(JSON.stringify(r, null, 2));
}

// main
(async function() {
    await main();
    process.exit(0);
})();
