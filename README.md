
# Darwinia-Proof-Tools

## Usage

To install and set up Darwinia-Proof-Tools, 

set /config/default.json

run:

```javascript
{
    "WEB3_RPC_SERVER": "https://ropsten.infura.io/v3/",
    "INFURA_KEYS":[],   // https://infura.io/
    "DARWINIA_RPC_SERVER": "",
    "KEYRING": "" // Optional, Use alice and bob by default, darwinia network account mnemonic word
}

```


```console
yarn

yarn build

// Automatically start the eth relay service
yarn start

// Need to manually run eth relay via http://localhost:3006/# web ui
yarn start-not-autorun

// The latest Ethereum block height submitted by Eth Relay will be writed in ./finalizedBlockNumber, hasResetGenesisHeader will only be executed once, and the flag will be writed in the ./hasResetGenesisHeader file. This variable can be reset through the reset command
yarn reset
```

### Access Cross-chain Verification Demo
- http://localhost:3006/#


## Command-line usage

```js
const config: Config = {
    // this is the websocket addr of darwinia node, the default config assumes
    // that we run the tests on our local environment
    addr: "ws://0.0.0.0:9944",

    // this decides we run tests using static or dynamic eth headers
    //
    // static: the default headers are 7575765 and 7575766 in ropsten
    // testnet, our redeem tx is received by the 7575766 block.
    // 
    // dynamic: the dynamic choice means, we just send new txes, rely
    // them, and do the test stuffs, not recommend, if your network is
    // not good.
    dynamic: false,

    // DO NOT change this: this is the address of the redeem
    // contract holder in darwinia
    holder: "0xd7b504ddbe25a05647312daa8d0bbbafba360686241b7e193ca90f9b01f95faa",

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
};
```

### chapter.1.Test Relay

> Please make sure your local darwinia node is running and ports `ws` to `9944`, this is all you need.

Just run `yarn && yarn proof` in your command-line, yep, without any configs.

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

#### Errors

We can just run `Relay header` for once, because once we relayed the test `relay header` to `darwinia`, we can not relay it again, unless we clean all of our chain data, and restart our `darwinia node` from block 0.

### chapter.2.Send redeem requests to ropsten.

This tool is provided in `scripts/crash.ts`, we can keep sending redeem requests till we don't have any eth, the eth account is free to share:

```js
> {
  address: '0x2c7536E3605D9C16a7a3D7b1898e529396a65c23',
  privateKey: '0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318',
  signTransaction: function(tx){...},
  sign: function(data){...},
  encrypt: function(password){...}
}
```

#### Note

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
[1]: https://github.com/darwinia-network/darwinia/blob/master/.maintain/types/types.json
