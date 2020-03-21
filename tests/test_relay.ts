import Config from "../src/ethereum/Config";
import { bootstrap } from "./bootstrap";

async function main(): Promise<void> {
    await bootstrap();
    const api = Config.polkadotApi;

    let current = await api.query.ethRelay.genesisHeader();
    console.log(current);
}

// main
(async function() {
    await main();
    process.exit(0);
})();
