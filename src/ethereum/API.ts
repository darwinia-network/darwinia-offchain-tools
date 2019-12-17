import config from "config";
import Config from "./Config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import Keyring from "@polkadot/keyring";
import { hexToU8a } from "@polkadot/util";
import logger from "../util/logger";
import { setDelay } from "./Utils";
import testKeyring from "@polkadot/keyring/testingPairs";

const customizeType: any = {
    "Bloom": "[u8; 256]",
    "EpochDuration": "u64",
    "EraIndex": "u32",
    "TimeStamp": "u64",
    "RingBalanceOf": "u128",
    "KtonBalanceOf": "u128",
    "ExtendedBalance": "u128",
    "EthBlockNumber": "u64",
    "StakingBalance": {
        "_enum": {
            "Ring": "RingBalanceOf",
            "Kton": "KtonBalanceOf"
        }
    },
    "IndividualExposure": {
        "who": "AccountId",
        "value": "ExtendedBalance"
    },
    "Exposure": {
        "total": "ExtendedBalance",
        "own": "ExtendedBalance",
        "others": "Vec<IndividualExposure>"
    },
    "ValidatorPrefs": {
        "node_name": "Vec<u8>",
        "unstake_threshold": "Compact<u32>",
        "validator_payment_ratio": "Compact<u32>"
    },
    "StakingLedger": {
        "stash": "AccountId",
        "active_ring": "Compact<RingBalanceOf>",
        "active_deposit_ring": "Compact<RingBalanceOf>",
        "active_kton": "Compact<KtonBalanceOf>",
        "deposit_items": "Vec<TimeDepositItem>",
        "ring_staking_lock": "StakingLock",
        "kton_staking_lock": "StakingLock"
    },
    "TimeDepositItem": {
        "value": "Compact<RingBalanceOf>",
        "start_time": "Compact<Moment>",
        "expire_time": "Compact<Moment>"
    },
    "BalanceLock": {
        "id": "LockIdentifier",
        "withdraw_lock": "WithdrawLock",
        "reasons": "WithdrawReasons"
    },
    "WithdrawLock": {
        "_enum": {
            "Normal": "NormalLock",
            "WithStaking": "StakingLock"
        }
    },
    "NormalLock": {
        "amount": "u128",
        "until": "Moment"
    },
    "StakingLock": {
        "staking_amount": "u128",
        "unbondings": "Vec<NormalLock>"
    },
    "EthHeader": {
        "parent_hash": "H256",
        "timestamp": "u64",
        "number": "EthBlockNumber",
        "auth": "H160",
        "transaction_root": "H256",
        "uncles_hash": "H256",
        "extra_data": "Bytes",
        "state_root": "H256",
        "receipts_root": "H256",
        "log_bloom": "Bloom",
        "gas_used": "U256",
        "gas_limit": "U256",
        "difficulty": "U256",
        "seal": "Vec<Bytes>",
        "hash": "Option<H256>"
    },
    "ActionRecord": {
        "index": "u64",
        "proof": "Vec<u8>",
        "header_hash": "H256"
    },
    "BestBlock": {
        "height": "EthBlockNumber",
        "hash": "H256",
        "total_difficulty": "U256"
    },
    "H64": {
        "_struct": "[u8; 8]"
    },
    "BlockDetails": {
        "height": "EthBlockNumber",
        "hash": "H256",
        "total_difficulty": "U256"
    },
    "LogEntry": {
        "address": "H160",
        "topics": "Vec<H256>",
        "data": "Bytes"
    },
    "Receipt": {
        "gas_used": "U256",
        "log_bloom": "Bloom",
        "logs": "Vec<LogEntry>",
        "outcome": "TransactionOutcome"
    },
    "TransactionOutcome": {
        "_enum": {
            "Unknown": null,
            "StateRoot": "H256",
            "StatusCode": "u8"
        }
    },
};

export default class API {
    async setPolkadotJs(): Promise<any> {
        const provider = new WsProvider(config.get("DARWINIA_RPC_SERVER"));
        const api = await this.createApi(provider);
        Config.polkadotApi = api;
    }

    async createApi(provider: any): Promise<any> {
        return await ApiPromise.create({
            types: customizeType,
            provider: provider
        });
    }

    setKeyringAccount(): void {
        const keypair = new Keyring({ type: "ed25519" });
        let account = null;
        if(config.get("KEYRING") != "") {
            account = keypair.addFromSeed(hexToU8a(config.get("KEYRING")));
        } else {
            account = testKeyring().alice; 
        }
        Config.KeyringAccount = account;
        Config.KeyringAccountBob =  testKeyring().bob; 
    }

    async start(): Promise<any> {
        try {
            await this.setPolkadotJs();
            logger.info("polkadotjs init success!");
            this.setKeyringAccount();
        } catch (error) {
            logger.info("resetPolkadotJs! " + error);
            setDelay(20000).then(async () => {
                await this.start();
            });
        }
    }
}