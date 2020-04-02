import { IConfig } from "./src/types";

const config: IConfig = {
    // this is the websocket addr of darwinia node, the default config assumes
    // that we run the tests on our local environment
    addr: "ws://0.0.0.0:9944",

    // this decides we run tests using static or dynamic eth headers
    //
    // static: the default headers are 7575765 and 7575766 in ropsten
    // testnet, our redeem tx is received by the 7575766 block.
    //
    // dynamic: the dynamic choice means, we just send new txes, relay
    // them, and do the test stuffs, not recommend, if your network is
    // not good.
    dynamic: false,

    // DO NOT change this: this is the address of the redeem
    // contract holder in darwinia
    holder: "0xd7b504ddbe25a05647312daa8d0bbbafba360686241b7e193ca90f9b01f95faa",

    // this seed is used for eth-relay service, you can either use this config
    // or pass your seed into the script directly.
    relaySeed: "//Alice",

    // reset action requires root account of darwinia, if you are under the
    // dev chain, DO NOT change this.
    sudo: "//Alice",

    // this is an infura api for web3, the secret key own by @clearloop, free to
    // share, change a new one if this run out of requesting limits
    web3: "https://ropsten.infura.io/v3/48751b4dbbc84894a1fa3197b6446ec2",

    // this is a secret key of an ethereum account, keep this account has eth in
    // ropsten testnet, and has ring in the darwinia testnet which is binding to
    // the ropten testnet.
    //
    // runnig out of ring will cause our web3 requests get reverted by EVM if
    // you are wondering how to get some ring, plz check out the README under
    // this directory
    priv: "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318",

    // storage root
    //
    // - the crash script will save blocks to `${root}/crash_blocks.db`
    // - the relay-service will save blocks to `${root}/relay_blocks.db`
    //
    // this command tool will parse `~` as home_dir directly
    root: "~/.darwinia",
};

export default config;

