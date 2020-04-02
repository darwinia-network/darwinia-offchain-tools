/* tslint:disable:no-var-requires */
/**
 *
 *  keep sending redeem txes to fetch uncle blocks, the
 *  block data will save at `${config.root}/crash_block.db`
 *  with `sqlite3`.
 *
 */
import * as path from "path";

import Web3 from "web3";
import Service from "./service";

import { IConfig } from "../types";
import { burn, log, Logger, storePath } from "../utils";

class Crash extends Service {
    protected config: IConfig;
    private addr: string;
    private contract: any;
    private knex: any;
    private loop: boolean;
    private receipt: number;
    private sent: number;
    private web3: any;

    constructor(config: IConfig) {
        super();
        this.config = config;

        // init sqlite3 to save txs
        this.knex = require("knex")({
            client: "sqlite3",
            connection: {
                filename: storePath(path.join(config.root, "crash_blocks.db")),
            },
            useNullAsDefault: true,
        });
    }

    /**
     *
     * start crash service
     *
     */
    public async start(): Promise<void> {
        log("start tx loop...");
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.web3));
        this.web3.eth.accounts.wallet.add(this.config.priv);
        this.addr = this.web3.eth.accounts.wallet[0].address;
        this.contract = burn(this.web3, this.addr);

        await this.checkTable();

        this.tx().catch(() => {
            log("tx loop got broken.", Logger.Error);
        });
    }

    /**
     *
     * stop crash service
     *
     */
    public async stop(): Promise<void> {
        this.loop = false;
    }

    /**
     *
     * check table exists
     *
     */
    private async checkTable(): Promise<void> {
        const exists = await this.knex.schema.hasTable("blocks");
        if (!exists) {
            this.knex.schema.createTable("blocks", (table: any) => {
                table.integer("height");
                table.string("tx");
            }).catch((_: any) => console.error);
        }

        await this.knex("blocks").count("tx").then((r: any) => {
            this.sent = r[0]["count(`tx`)"];
            this.receipt = r[0]["count(`tx`)"];
            log(`now we have sent ${this.sent} txes, received ${this.receipt} txes`);
        });
    }


    /**
     *
     * send redeem tx
     *
     */
    private async tx(): Promise<void> {
        this.sent += 1;

        log(`sending the ${this.sent}-th tx...`);
        log(`${new Date().toLocaleString()}`);

        await this.contract.send({
            from: this.addr,
            gas: 1000000,
        })
            .on("receipt", (r: any) => {
                this.receipt += 1;
                log(`receiving the ${this.receipt}-th tx`);
                log(`block(${r.blockNumber}) tx(${r.transactionHash})`, Logger.Success);
                this.knex("blocks").insert({
                    height: r.blockNumber,
                    tx: r.transactionHash,
                }).catch(() => {
                    log("insert block info to db failed.", Logger.Error);
                });
            })
            .catch(() => {
                log("send tx failed.", Logger.Error);
            });


        if (this.loop) {
            await this.tx();
        }
    }
}

export default Crash;
