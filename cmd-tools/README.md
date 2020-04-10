# cmd-tools

```js
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
```

## Knowledges

+ If you are wondering that how to setup a darwinia node, check [this][node].

+ If you want to reset genesis header, your sudo account must has the related authority, the sudo account has the root authority by default, in local dev network.

+ the redeem receiver account must not be dead account (have been deposited before)

+ the receipt proof spec of the smart contract, including the knowledge or prefixed receiver hex address, and validation. (Normal subkey hex address(public key) does not include prefix)

+ More turorials, please check [this][guide].


Don't worry if you don't know how to check the tips above, the tools below will help you testing darwinia with just putting them inside a black-box.


## Services

### Crash Uncle

```
yarn crash
```

This tool is provided in `scripts/crash.ts`, we can keep sending redeem requests till we don't have any eth, used for fetching the eth block both has our txes and uncles.


### Relay Service

```
yarn relay
```

Keep relaying eth blocks to darwinia


### Fetcher Service

```
yarn fetch
```

Keep fetching eth blocks, convert them into darwinia-eth-blocks and save in `~/.darwinia/relay_blocks.db` by default.


## Test Tools

### Integration Tests

> Please make sure your local darwinia node is running and ports `ws` to `9944`, this is all you need.

```
𝝺 yarn proof
yarn run v1.21.1
$ ts-node ./scripts/relay.ts
? Test which process? › - Use arrow-keys. Return to submit.
❯   All - Test all process dynamic
    Get Balances
    Genesis header
    Relay header
    Redeem
```

### Relay services

```
yarn relay:services
```


This tool will raise 3 relay services to test the eth-relay in darwinia.

## Note

### Accounts

If you burn out all eth in this account, please deposit some back into it, then we are still good friends.

You can just 

```
wget https://faucet.ropsten.be/donate/0x2c7536E3605D9C16a7a3D7b1898e529396a65c23
```

in command line or click [https://faucet.ropsten.be/][0] and paste `0x2c7536E3605D9C16a7a3D7b1898e529396a65c23` to the input box, don't forget to click `Send me test Ether` before you closing the generous window.


## Hack guide

### Q1 - How to get the lastest `types.json`

[Here][1] it is.

If you don't know what is `types.json` or how to use it, please ignore these lines, it doesn't matter, or you can rise a new issue or mail us, welcome to join darwinia!

[0]: https://faucet.ropsten.be/
[1]: https://github.com/darwinia-network/darwinia/blob/master/runtime/crab/types.json
[guide]: https://github.com/darwinia-network/darwinia/wiki/Eth-backing-tutorial
[node]: https://github.com/darwinia-network/darwinia
