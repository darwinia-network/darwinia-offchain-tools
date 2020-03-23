import Web3 from "web3";
import Config from "../src/ethereum/Config";
import burn from "./lib/burn";

let sent = 0;
let receipt = 0;

// init sqlite3 to save txs
// eslint-disable-next-line @typescript-eslint/no-var-requires
const knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./blocks.db"
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
        }).catch((e: any) => console.error);
    }

    await knex("blocks").count("tx").then((r: any) => {
        sent = r[0]["count(`tx`)"];
        receipt = r[0]["count(`tx`)"];
        console.log(`[ info ]: now we have sent ${sent} txes, received ${receipt} txes`);
    });
}

// send tx and store resp
export default async function tx(addr: any, contract: any, loop: boolean) {
    sent += 1;

    console.log(`[ info ]: sending the ${sent}-th tx...`);
    console.log(`[ timestamp ]: ${new Date().toLocaleString()}`);

    await contract.send({
        from: addr,
        gas: 500000,
    })
        .on("receipt", (r: any) => {
            receipt += 1;
            console.log(`[ info ]: receiving the ${receipt}-th tx`);
            console.log(`[ receipt ]: block(${r.blockNumber}) tx(${r.transactionHash})`);
            knex("blocks").insert({ height: r.blockNumber, tx: r.transactionHash }).catch(() => {
                console.error("[ error ]: insert block info to db failed.");
                process.exit(1);
            });
        })
        .catch((e: any) => {
            console.error("[ error ]: send tx failed.");
            console.error(e);
            process.exit(1);
        });

    // start loop
    if (loop) {
        await tx(addr, contract, true);
    }
}

// loop block and tx to sqlite
async function loop() {
    console.log("[ info ]: start tx loop...");
    const web3 = new Web3(new Web3.providers.HttpProvider(Config.network as string));
    web3.eth.accounts.wallet.add(
        "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318"
    );

    const addr = web3.eth.accounts.wallet[0].address;
    const contract = burn(web3, addr);
    await checkTable();

    tx(addr, contract, true).catch(() => {
        console.error("[ error ]: tx loop got broken.");
        process.exit(1);
    });
}

/** Account
 * // in node.js
 * var Web3EthAccounts = require('web3-eth-accounts');
 * 
 * var account = new Web3EthAccounts('ws://localhost:8546');
 * account.create();
 * > {
 *   address: '0x2c7536E3605D9C16a7a3D7b1898e529396a65c23',
 *   privateKey: '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318',
 *   signTransaction: function(tx){...},
 *   sign: function(data){...},
 *   encrypt: function(password){...}
 * }
 */
(function() {
    loop();
}());
