/* tslint:disable:no-var-requires */
import * as path from "path";
import Web3 from "web3";
import { IConfig } from "../types";
import { log, Logger, parseHeader, storePath } from "../utils";
import Service from "./service";

class Fetcher extends Service {
    public max: number;
    public count: number;
    protected loop: boolean;
    protected config: IConfig;
    private knex: any;
    private web3: any;

    constructor(config: IConfig) {
        super();

        // init sqlite3 to save blocks
        this.knex = require("knex")({
            client: "sqlite3",
            connection: {
                filename: storePath(path.join(config.root, "relay_blocks.db")),
            },
            useNullAsDefault: true,
        });

        // init web3
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.web3));

        this.loop = false;
        this.max = 0;
    }

    /**
     * get block from sqlite
     */
    public async getBlock(num: number) {
        const tx = await this.knex("blocks")
            .select("*")
            .whereRaw(`blocks.height = ${num}`);

        if (tx.length === 0) {
            return null;
        } else {
            return JSON.parse(tx[0].block);
        }
    }

    /**
     * loop block and tx to sqlite
     */
    public async start(start?: number): Promise<void> {
        if (start === undefined) {
            const max = await this.knex("blocks").max("height");
            start = max[0]["max(`height`)"];
        }

        // set status
        const count = await this.knex("blocks").count("height");
        this.max = start;
        this.count = count[0]["count(`height`)"];

        this.loop = true;
        await this.checkTable(start);
        log(`start fetching eth headers from ${start}...`, Logger.EventMsg);

        this.fetch(start).catch((e) => {
            log(e, Logger.Error);
        });
    }

    /** stop loop
     * we can restart it just by runing `this.start()` again.
     */
    public async stop(): Promise<void> {
        log("stop fetcher process...", Logger.EventMsg);
        this.loop = false;
    }


    /**
     * check if fetcher is running
     */
    public status(): boolean {
        return this.loop;
    }

    /**
     * get ethereum headers, restart when
     *
     * - has fetched
     * - got null block
     * - reach the lastest block
     */
    public async fetch(height: number) {
        const exists = await this.knex("blocks").whereExists(
            this.knex("blocks").select("height").whereRaw(`blocks.height = ${height}`),
        );

        if (exists.length > 0) {
            log("header exists, move to next...");
            await this.fetch(height + 1);
            return;
        }

        log(`fetching the ${height} block...`);
        let block = await this.web3.eth.getBlock(height).catch(async (e: any) => {
            log(e, Logger.Warn);
        });

        if (block != null) {
            block = parseHeader(block);
            log(`got block ${block.hash}`);
            log(`\t${JSON.stringify(block)}`);
            await this.knex("blocks").insert({
                block: JSON.stringify(block),
                height,
            }).catch((e: any) => {
                log(e, Logger.Warn);
            });

            this.max = height;

            if (this.loop) {
                await this.fetch(height + 1);
            }
        } else {
            await this.restart(height);
        }
    }

    /**
     * check if table exists
     */
    private async checkTable(start: number) {
        const exists = await this.knex.schema.hasTable("blocks");
        if (!exists) {
            this.knex.schema.createTable("blocks", (table: any) => {
                table.integer("height").unique();
                table.string("block").unique();
            }).catch((e: any) => log(e, Logger.Error));
        } else {
            // delete useless blocks
            await this.knex("blocks")
                .where("height", "<", start)
                .del();
        }
    }

    /**
     *  restart fetcher
     */
    private async restart(height: number) {
        log("reached the lastest block, sleep for 10 seconds", Logger.Warn);
        await new Promise(async () => setTimeout(async () => {
            await this.fetch(height);
        }, 10000));
    }
}

export default Fetcher;
