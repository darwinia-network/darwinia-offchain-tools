/* tslint:disable:no-var-requires */
import config from "../../cfg";
import { Queue, QueueCase } from "../queue";

const prompts = require("prompts");

// main
(async () => {
    const res = await prompts({
        choices: [{
            description: "Test all process dynamic",
            title: "All",
            value: QueueCase.TestAll,
        }, {
            description: "Get balances in current account",
            title: "Get Balances",
            value: QueueCase.GetBalance,
        }, {
            description: "init or reset genesis header",
            title: "Reset header",
            value: QueueCase.ResetGenesis,
        }, {
            description: "Relay a new header to darwinia",
            title: "Relay header",
            value: QueueCase.RelayHeader,
        }, {
            description: "redeem balances from darwinia",
            title: "Redeem",
            value: QueueCase.RedeemBalances,
        }],
        initial: 0,
        message: "Test which process?",
        name: "value",
        type: "select",
    }, {
        onCanceled: () => process.exit(0),
    });

    const queue = new Queue(config);
    await queue.init();

    queue.run(res.value);
})();
