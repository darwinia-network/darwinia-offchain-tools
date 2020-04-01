import * as path from "path";
import Web3 from "web3";
import { config } from "../cfg";
import { storePath, log, Logger, parseHeader } from "./utils";

// init sqlite3 to save blocks
// eslint-disable-next-line @typescript-eslint/no-var-requires
const knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: storePath(path.join(config.root, "relay_blocks.db")),
    },
    useNullAsDefault: true
});

// check if table exists
async function checkTable(start: number) {
    const exists = await knex.schema.hasTable("blocks");
    if (!exists) {
        knex.schema.createTable("blocks", (table: any) => {
            table.integer("height").unique();
            table.string("block").unique();
        }).catch((e: any) => log(e, Logger.Error));
    } else {
        // delete useless blocks
        await knex("blocks")
            .where("height", "<", start)
            .del();
    }
}

async function restart(number: number) {
    log("reached the lastest block, sleep for 10 seconds", Logger.Warn);
    setTimeout(async () => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await fetch.call(this, number, true);
    }, 10000);
}

// get ethereum headers, restart when
//
// - has fetched
// - got null block
// - reach the lastest block
export default async function fetch(number: number, loop: boolean) {
    const exists = await knex("blocks").whereExists(function() {
        this.select("*").from("blocks").whereRaw(`blocks.height = ${number}`);
    });

    if (exists.length > 0) {
        log("header exists, move to next...");
        await fetch.call(this, number + 1, true);
        return;
    }

    let block = await this.eth.getBlock(number).catch(async (e: any) => {
        log(e, Logger.Warn);
        await restart.call(this, number);
    });

    if (block != null) {
        block = parseHeader(block);
        log(`got block ${block.hash}`);
        log(`\t${JSON.stringify(block)}`);
        await knex("blocks").insert({
            height: number,
            block: JSON.stringify(block)
        });

        if (loop) {
            await fetch.call(this, number + 1, true);
        }
    } else {
        await restart.call(this, number);
    }
}

// loop block and tx to sqlite
export async function fetcher(start?: number) {
    if (start === undefined) {
        let r = await knex("blocks").max("height");
        start = r[0]["max(`height`)"];
    }

    log(`start fetching eth headers from ${start}...`);
    const web3 = new Web3(new Web3.providers.HttpProvider(config.web3));
    await checkTable(start);

    fetch.call(web3, start, true).catch(() => {
        log("eth header fetcher got broken", Logger.Error);
    });
}

export async function getBlock(number: number) {
    const tx = await knex("blocks")
        .select("*")
        .whereRaw(`blocks.height = ${number}`);

    if (tx.length === 0) {
        return false;
    } else {
        return JSON.parse(tx[0].block);
    }
}
