/* eslint-disable */
const chalk = require("chalk");
import { bufferToU8a, u8aToHex } from "@polkadot/util";
import { rlp } from "ethereumjs-util";

export enum Logger {
    Error,
    Event,
    EventMsg,
    Info,
    Success,
}

export function st(ex: any, err: string) {
    ex.signAndSend(
        this.account, {}, (r: any) => {
            try {
                log.call(this.queue, r, Logger.Event);
            } catch (_) {
                log(err, Logger.Error);
            }
        }
    ).catch(() => log(err, Logger.Error));
}

export function log(s: any, logger?: Logger) {
    const l = chalk.dim("[ ");
    const r = chalk.dim(" ]:");

    switch (logger) {
        case Logger.Error:
            console.error(`${l + chalk.red("error") + r} ${s}`);
            process.exit(1);
        case Logger.Event:
            parseRes.call(this, s);
            break;
        case Logger.EventMsg:
            console.log(`${l + chalk.magenta("event") + r} ${s}`);
            break;
        case Logger.Success:
            console.log(`${l + chalk.green("success") + r} ${s}`);
            break;
        default:
            console.log(chalk.dim(`[ ${chalk.cyan.dim("info")} ] ${s}`));
            break;
    }
}

function parseRes(r: any) {
    let status = r.status;
    log(`Transaction status: ${status.type}`);

    if (status.isInBlock) {
        log(`Included at block hash: ${status.asInBlock.toHex()}`);
        r.events && r.events.forEach((r: any) => {
            log(
                "\t" +
                r.phase.toString() +
                `: ${r.event.section}.${r.event.method}` +
                r.event.data.toString()
            );

            //@hack
            if (r.event.method.toLowerCase().indexOf("failed") > -1) {
                throw "ex failed";
            }
        });
    } else if (status.isFinalized) {
        log(`Finalized block hash: ${status.asFinalized.toHex()}`);
        this.active = false;
        this.finished = true;
    }
}

export function parseHeader(block: any): any {
    const mixh = bufferToU8a(rlp.encode(block.mixHash));
    const nonce = bufferToU8a(rlp.encode(block.nonce));
    const seal = [u8aToHex(mixh), u8aToHex(nonce)];

    return {
        parent_hash: block.parentHash,
        timestamp: block.timestamp,
        number: block.number,
        auth: block.miner,
        transaction_root: block.transactionsRoot,
        uncles_hash: block.sha3Uncles,
        extra_data: block.extraData,
        state_root: block.stateRoot,
        receipts_root: block.receiptsRoot,
        log_bloom: block.logsBloom,
        gas_used: block.gasUsed,
        gas_limit: block.gasLimit,
        difficulty: block.difficulty,
        seal: seal,
        hash: block.hash
    };
}
