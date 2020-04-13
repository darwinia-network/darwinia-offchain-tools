export enum Event {
    None,
    GetBalance,
    GetReceipt,
    GetContainerHeader,
    GetGenesisHeader,
    Reset,
    Relay,
    Redeem,
    SendTx,
    Transfer,
}

export interface IQueue {
    active: boolean;
    events: Event[];     // event queue
    success: boolean;    // if succeed
}

export interface IHeaders {
    genesis: any;            // genesis header
    container: any;          // the header contains our tx
    receipt: any;            // the receipt proof of darwinia
    receiptHash: any;        // the receipt hash of burn cotract
}

export interface IConfig {
    addr: string;
    dynamic: boolean;
    holder: string;
    priv: string;
    sudo: string;
    web3: string;
    relaySeed: string;
    root: string;
}
