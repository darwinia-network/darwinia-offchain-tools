import Config from "./Config";
import logger from "../util/logger";

export class BlockchainState {

    getState(): Promise<any> {
        return BlockchainState.getBlockState().then(([blockInChain]: [number]): number => {
            if(!blockInChain) return;
            Config.EthereumBlockNumberInChain = blockInChain;
            logger.info("The latest block height[Ethereum network]: " + Config.EthereumBlockNumberInChain);
            return blockInChain;
        });
    }

    static getBlockState(): Promise<any[]> {
        const latestBlockOnChain = Config.web3.eth.getBlockNumber();
        return Promise.all([latestBlockOnChain]);
    }
}