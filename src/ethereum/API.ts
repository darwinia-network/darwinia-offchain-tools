import config from "config";
import Config from "./Config";
import { ApiPromise, WsProvider } from "@polkadot/api";
import Keyring from "@polkadot/keyring";
import { hexToU8a } from "@polkadot/util";
import logger from "../util/logger";
import { setDelay } from "./Utils";
import testKeyring from "@polkadot/keyring/testingPairs";

const customizeType: any = {
	"EpochDuration": "u64",
	"BalanceLock": {
		"id": "LockIdentifier",
		"withdraw_lock": "WithdrawLock",
		"reasons": "WithdrawReasons"
	},
	"NormalLock": {
		"amount": "Balance",
		"until": "Moment"
	},
	"StakingLock": {
		"staking_amount": "Balance",
		"unbondings": "Vec<NormalLock>"
	},
	"WithdrawLock": {
		"_enum": {
			"Normal": "NormalLock",
			"WithStaking": "StakingLock"
		}
	},
	"EthReceiptProof": {
		"index": "u64",
		"proof": "Bytes",
		"header_hash": "H256"
	},
	"BestBlock": {
		"height": "EthBlockNumber",
		"hash": "H256",
		"total_difficulty": "U256"
	},
	"BlockDetails": {
		"height": "EthBlockNumber",
		"hash": "H256",
		"total_difficulty": "U256"
	},
	"Bloom": {
		"_struct": "[u8; 256]"
	},
	"EthAddress": "H160",
	"EthBlockNumber": "u64",
	"EthHeader": {
		"parent_hash": "H256",
		"timestamp": "u64",
		"number": "EthBlockNumber",
		"auth": "EthAddress",
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
	"EthTransactionIndex": "(H256, u64)",
	"H64": {
		"_struct": "[u8; 8]"
	},
	"LogEntry": {
		"address": "EthAddress",
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
	"EraIndex": "u32",
	"Exposure": {
		"total": "Compact<Power>",
		"own": "Compact<Power>",
		"others": "Vec<IndividualExposure>"
	},
	"IndividualExposure": {
		"who": "AccountId",
		"value": "Compact<Power>"
	},
	"Kton": "Balance",
	"NominatorReward": {
		"who": "AccountId",
		"amount": "Compact<Balance>"
	},
	"Power": "u128",
	"Ring": "Balance",
	"SlashJournalEntry": {
		"who": "AccountId",
		"amount": "Compact<Power>",
		"own_slash": "Compact<Power>"
	},
	"StakingBalances": {
		"_enum": {
			"Ring": "Balance",
			"Kton": "Balance"
		}
	},
	"StakingLedger": {
		"stash": "AccountId",
		"active_ring": "Compact<Balance>",
		"active_deposit_ring": "Compact<Balance>",
		"active_kton": "Compact<Balance>",
		"deposit_items": "Vec<TimeDepositItem>",
		"ring_staking_lock": "StakingLock",
		"kton_staking_lock": "StakingLock"
	},
	"TimeDepositItem": {
		"value": "Compact<Balance>",
		"start_time": "Compact<Moment>",
		"expire_time": "Compact<Moment>"
	},
	"ValidatorPrefs": {
		"node_name": "Bytes",
		"validator_payment_ratio": "Compact<u32>"
	},
	"ValidatorReward": {
		"who": "AccountId",
		"amount": "Compact<Balance>",
		"nominators_reward": "Vec<NominatorReward>"
	}
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