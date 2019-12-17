import Config from "./Config";
export class BlockchainState {

    getState(): Promise<any> {
        return BlockchainState.getBlockState().then(([blockInChain]: [number]): number => {
            if(!blockInChain) return;
            Config.EthereumBlockNumberInChain = blockInChain;
            console.log("blockInChain: ", Config.EthereumBlockNumberInChain);
            return blockInChain;
        });
    }

    static getBlockState(): Promise<any[]> {
        const latestBlockOnChain = Config.web3.eth.getBlockNumber();
        return Promise.all([latestBlockOnChain]);
    }
}