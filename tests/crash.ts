import Web3 from "web3";
import Config from "../src/ethereum/Config";
import mockContract from "./contract";

// init sqlite3 to save txs
const knex = require("knex")({
    client: "sqlite3",
    connection: {
        filename: "./blocks.db"
    }
});

// check if table exists
async function checkTable() {
    let exists = await knex.schema.hasTable("blocks");
    if (!exists) {
        knex.schema.createTable("blocks", (table: any) => {
            table.integer("height");
            table.integer("tx");
        });
    }
}

// send tx and store resp
export default async function tx(addr: any, contract: any) {
    contract.send({
        from: addr,
        gas: 500000,
    })
        .on("receipt", (r: any) => {
            console.log(r);
        })
        .catch((e: any) => {
            console.error(e);
        })
}

// loop block and tx to sqlite
async function loop() {
    const web3 = new Web3(new Web3.providers.HttpProvider(Config.network as string));
    web3.eth.accounts.wallet.add(
        "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318"
    );

    const addr = web3.eth.accounts.wallet[0].address;
    const contract = mockContract(web3, addr);

    await checkTable();

    tx(addr, contract);
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
