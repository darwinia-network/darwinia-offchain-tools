import API from "../../api";
import { log, Logger } from "../../utils";
import config from "../../../cfg";

(async () => {
    if (process.argv.length < 3) {
        console.log("usage: reset <number>/<height>");
        process.exit(0);
    }

    // get the target block
    const block = process.argv[2];

    // init api
    let api = new API(config);
    await api.init();

    // reset header
    api.queue.active = true;
    api.headers.genesis = await api.web3.eth.getBlock(block);
    log(`fetching the ${block} from infura...`);

    // reset header
    api.reset();
    log(`reset header`, Logger.EventMsg);

    // exit process
    setInterval(() => {
        if (api.queue.active === false && api.queue.success) {
            log(`reset header succeed!`, Logger.Success);
            process.exit(0);
        }
    }, 500)
})();
