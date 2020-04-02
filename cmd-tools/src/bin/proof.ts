/* tslint:disable:no-var-requires */
import { config } from "../../cfg";
import { queue } from "../queue";
import Relay from "../relay";

const prompts = require("prompts");

// main
(async () => {
    const res = await prompts({
        choices: [
            { title: "All", description: "Test all process dynamic", value: 0 },
            { title: "Get Balances", description: "Get balances in current account", value: 1 },
            { title: "Reset header", description: "init or reset genesis header", value: 2 },
            { title: "Relay header", description: "Relay a new header to darwinia", value: 3 },
            { title: "Redeem", description: "redeem balances from darwinia", value: 4 },
        ],
        initial: 0,
        message: "Test which process?",
        name: "value",
        type: "select",
    }, {
        onCanceled: () => process.exit(0),
    });

    const proof = new Relay(config);
    await proof.init();

    queue.call(proof, res.value);
})();
