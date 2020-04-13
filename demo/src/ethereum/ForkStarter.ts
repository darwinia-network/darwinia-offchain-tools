import Starter from "../ethereum/Starter";
import process from "process";
import Config from "./Config";


process.on("message", (data) => {
    if(data.finalizedBlockNumber) {
        Config.EthereumBlockNumberInNode = data.finalizedBlockNumber;
    }
});

const ethereumProofStarter = new Starter();
// eslint-disable-next-line @typescript-eslint/no-empty-function
ethereumProofStarter.start().then(() => {}).catch(() => {});
