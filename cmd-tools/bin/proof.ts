import Relay from "../lib/relay";
import { queue } from "../lib/queue";
import { config } from "../cfg";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const prompts = require("prompts");


// main
(async function() {
  const res = await prompts({
    type: "select",
    name: "value",
    message: "Test which process?",
    choices: [
      { title: "All", description: "Test all process dynamic", value: 0 },
      { title: "Get Balances", description: "Get balances in current account", value: 1 },
      { title: "Reset header", description: "init or reset genesis header", value: 2 },
      { title: "Relay header", description: "Relay a new header to darwinia", value: 3 },
      { title: "Redeem", description: "redeem balances from darwinia", value: 4 },
    ],
    initial: 0,
  }, {
    onCanceled: () => process.exit(0),
  });

  const proof = new Relay(config);
  await proof.init();

  queue.call(proof, res.value);
})();
