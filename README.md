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