import * as path from "path";
import Web3 from "web3";
import burn from "../lib/burn";
import { config } from "../cfg";
import { storePath, log, Logger } from "../lib/utils";

let sent = 0;
let receipt = 0;

// init sqlite3 to save txs
// eslint-disable-next-line @typescript-eslint/no-var-requires
const knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: storePath(path.join(config.root, "crash_blocks.db")),
    },
    useNullAsDefault: true
});

// check if table exists
async function checkTable() {
    const exists = await knex.schema.hasTable("blocks");
    if (!exists) {
        knex.schema.createTable("blocks", (table: any) => {
            table.integer("height");
            table.string("tx");
        }).catch((_: any) => console.error);
    }

    await knex("blocks").count("tx").then((r: any) => {
        sent = r[0]["count(`tx`)"];
        receipt = r[0]["count(`tx`)"];
        log(`now we have sent ${sent} txes, received ${receipt} txes`);
    });
}

// send tx and store resp
export default async function tx(addr: any, contract: any, loop: boolean) {
    sent += 1;

    log(`sending the ${sent}-th tx...`);
    log(`${new Date().toLocaleString()}`);

    await contract.send({
        from: addr,
        gas: 1000000,
    })
        .on("receipt", (r: any) => {
            receipt += 1;
            log(`receiving the ${receipt}-th tx`);
            log(`block(${r.blockNumber}) tx(${r.transactionHash})`, Logger.Success);
            knex("blocks").insert({ height: r.blockNumber, tx: r.transactionHash }).catch(() => {
                log("insert block info to db failed.", Logger.Error);
            });
        })
        .catch(() => {
            log("send tx failed.", Logger.Error);
        });

    // start loop
    if (loop) {
        await tx(addr, contract, true);
    }
}

// loop block and tx to sqlite
async function loop() {
    log("start tx loop...");
    const web3 = new Web3(new Web3.providers.HttpProvider(config.web3));
    web3.eth.accounts.wallet.add(config.priv);

    const addr = web3.eth.accounts.wallet[0].address;
    const contract = burn(web3, addr);
    await checkTable();

    tx(addr, contract, true).catch(() => {
        log("tx loop got broken.", Logger.Error);
    });
}

// main
(function() {
    loop();
}());
