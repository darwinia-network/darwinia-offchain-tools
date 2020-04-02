/**
 * eth header fetcher 
 */
import * as path from "path";
import Web3 from "web3";
import Service from "./service";
import { config } from "../cfg";
import { storePath, log, Logger, parseHeader } from "../lib/utils";

class Fetcher extends Service {
    private knex: any;
    private web3: any;
    public max: number;
    public count: number;
    protected loop: boolean;

    constructor() {
        super();

        // init sqlite3 to save blocks
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.knex = require("knex")({
            client: "sqlite3",
            connection: {
                filename: storePath(path.join(config.root, "relay_blocks.db")),
            },
            useNullAsDefault: true
        });

        // init web3
        this.web3 = new Web3(
            new Web3.providers.HttpProvider(config.web3)
        );

        this.loop = false;
        this.max = 0;
    }

    /**
     *
     * get block from sqlite	
     *
     */
    public async getBlock(number: number) {
        const tx = await this.knex("blocks")
            .select("*")
            .whereRaw(`blocks.height = ${number}`);

        if (tx.length === 0) {
            return null;
        } else {
            return JSON.parse(tx[0].block);
        }
    }

    /**
     *
     * loop block and tx to sqlite
     *
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

        this.fetch(start).catch(() => {
            log("eth header fetcher got broken", Logger.Error);
        });
    }

    /** stop loop
     *
     * we can restart it just by runing `this.start()` again.
     *
     */
    public async stop(): Promise<void> {
        log("stop fetcher process...", Logger.EventMsg);
        this.loop = false;
    }


    /**
     *
     * if fetcher is running 
     *
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
    private async fetch(number: number) {
        const exists = await this.knex("blocks").whereExists(function() {
            this.select("*").from("blocks").whereRaw(`blocks.height = ${number}`);
        });

        if (exists.length > 0) {
            log("header exists, move to next...");
            await this.fetch(number + 1);
            return;
        }

        log(`fetching the ${number} block...`);
        let block = await this.web3.eth.getBlock(number).catch(async (e: any) => {
            log(e, Logger.Warn);
            await this.restart(number);
        });

        if (block != null) {
            block = parseHeader(block);
            log(`got block ${block.hash}`);
            log(`\t${JSON.stringify(block)}`);
            await this.knex("blocks").insert({
                height: number,
                block: JSON.stringify(block)
            });

            this.max == number;

            if (this.loop) {
                await this.fetch(number + 1);
            }
        } else {
            await this.restart(number);
        }
    }

    // check if table exists
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

    // restart fetcher
    private async restart(number: number) {
        log("reached the lastest block, sleep for 10 seconds", Logger.Warn);
        setTimeout(async () => {
            await this.fetch(number);
        }, 10000);
    }
}

export default Fetcher;
