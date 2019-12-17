import Web3 from "web3";
import config from "config";
import { BlockNumber } from "web3-core";
import { KeyringPair } from "@polkadot/keyring/types";

export default class Config {
    static network = config.get("WEB3_RPC_SERVER");
    static web3 = new Web3(new Web3.providers.HttpProvider(Config.network as string));

    static polkadotApi: any = null;

    static EthereumBlockNumberInChain: BlockNumber;

    static EthereumBlockNumberInNode: BlockNumber;

    static KeyringAccount: KeyringPair = null;

    static KeyringAccountBob: KeyringPair = null;

    static blockStep = 1;

    static blockchainStateDelay = 20000;

    static startSubmitToDarwiniaDelay = 5000;

    static hasResetGenesisHeader = false;
}