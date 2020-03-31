// eslint-disable-next-line @typescript-eslint/no-var-requires
const chalk = require("chalk");

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { bufferToU8a, u8aToHex } from "@polkadot/util";
import { rlp } from "ethereumjs-util";

export enum Logger {
    Error,
    Event,
    EventMsg,
    Info,
    Success,
    Warn,
}

export async function log(s: any, logger?: Logger) {
    const l = chalk.dim("[ ");
    const r = chalk.dim(" ]:");

    switch (logger) {
        case Logger.Error:
            console.error(`${l + chalk.red("error") + r} ${s}`);
            process.exit(1);
        case Logger.Event:
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            await parseRes.call(this, s);
            break;
        case Logger.EventMsg:
            console.log(`${l + chalk.magenta("event") + r} ${s}`);
            break;
        case Logger.Success:
            console.log(`${l + chalk.green("success") + r} ${s}`);
            break;
        case Logger.Warn:
            console.log(`${l + chalk.yellow("warn") + r} ${s}`);
            break;
        default:
            console.log(chalk.dim(`[ ${chalk.cyan.dim("info")} ]: ${s}`));
            break;
    }
}

export async function parseRes(r: any) {
    const status = r.status;
    log(`Transaction status: ${status.type}`);

    if (status.isInBlock) {
        log(`Included at block hash: ${status.asInBlock.toHex()}`);
        r.events && r.events.forEach(async (r: any) => {
            log(
                "\t" +
                r.phase.toString() +
                `: ${r.event.section}.${r.event.method}` +
                r.event.data.toString()
            );

            // error	
            if (r.event.data[0].isModule) {
                const doc = await this.api.registry.findMetaError(r.event.data[0].asModule);
                const err = `${doc.name}.${doc.section} - ${doc.documentation.join(" ")}`;
                if (this.relayService) {
                    log(err, Logger.Warn);
                } else {
                    log(err, Logger.Error);
                }
            }
        });
    } else if (status.isFinalized) {
        log(`Finalized block hash: ${status.asFinalized.toHex()}`);
        this.queue.active = false;
    }
}

export function storePath(s: string): string {
    s = s.replace("~", os.homedir());
    const dirName = path.dirname(s);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    log(`your storage path is ${s}`);

    return s;
}

export function st(ex: any, err: string) {
    ex.signAndSend(
        this.account, {}, (r: any) => {
            try {
                log.call(this, r, Logger.Event);
            } catch (_) {
                log(err, Logger.Error);
            }
        }
    ).catch(() => log(err, Logger.Error));
}

export function parseHeader(block: any): any {
    const mixh = bufferToU8a(rlp.encode(block.mixHash));
    const nonce = bufferToU8a(rlp.encode(block.nonce));
    const seal = [u8aToHex(mixh), u8aToHex(nonce)];

    return {
        "parent_hash": block.parentHash,
        "timestamp": block.timestamp,
        "number": block.number,
        "auth": block.miner,
        "transaction_root": block.transactionsRoot,
        "uncles_hash": block.sha3Uncles,
        "extra_data": block.extraData,
        "state_root": block.stateRoot,
        "receipts_root": block.receiptsRoot,
        "log_bloom": block.logsBloom,
        "gas_used": block.gasUsed,
        "gas_limit": block.gasLimit,
        "difficulty": block.difficulty,
        "seal": seal,
        "hash": block.hash
    };
}