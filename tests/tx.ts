import Config from "../src/ethereum/Config";
import contract from "./contract";

export default function tx() {
    const web3 = Config.web3;
    let account = 0;
    var MyContract = contract(web3);

    MyContract.transferFrom[
        'address,address,uint256,bytes'
    ](
        account,
        '0xdBC888D701167Cbfb86486C516AafBeFC3A4de6e',
        '1000000000000000000',
        '0x2ad7b504ddbe25a05647312daa8d0bbbafba360686241b7e193ca90f9b01f95faa', {
        from: account
    }, (
        // _e, _txhash
    ) => {
        // $("#initDarwiniaTxhash").val(txhash);
        // $('#txHash').html(`txHash: <a target="_blank" href="https://ropsten.etherscan.io/tx/${txhash}">${txhash}</a>`)
    })
}
