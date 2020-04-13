$(document).ready(function () {
  // Place JavaScript code here...
  getRelayServer();
});

let TxHash = '';

async function burnring() {
  // @ts-ignore
  if (typeof window.ethereum !== 'undefined') {
    // @ts-ignore
    const accounts = await ethereum.enable()
    const account = accounts[0]
    console.log(account)
    // @ts-ignore
    const web3js = new Web3(window.web3.currentProvider);

    var MyContract = web3js.eth.contract([
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "stop",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_spender",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "owner_",
            "type": "address"
          }
        ],
        "name": "setOwner",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_from",
            "type": "address"
          },
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_newController",
            "type": "address"
          }
        ],
        "name": "changeController",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_guy",
            "type": "address"
          },
          {
            "name": "_wad",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "burn",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "name_",
            "type": "bytes32"
          }
        ],
        "name": "setName",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "stopped",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "authority_",
            "type": "address"
          }
        ],
        "name": "setAuthority",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "issue",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_guy",
            "type": "address"
          },
          {
            "name": "_wad",
            "type": "uint256"
          }
        ],
        "name": "burn",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_from",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "destroy",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_from",
            "type": "address"
          },
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_data",
            "type": "bytes"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "push",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "dst",
            "type": "address"
          },
          {
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "move",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_data",
            "type": "bytes"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "start",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "authority",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_spender",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_extraData",
            "type": "bytes"
          }
        ],
        "name": "approveAndCall",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "guy",
            "type": "address"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "guy",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_token",
            "type": "address"
          }
        ],
        "name": "claimTokens",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "src",
            "type": "address"
          },
          {
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "pull",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "controller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "_token",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "_controller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "ClaimedTokens",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "ERC223Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "guy",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "Mint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "guy",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "Burn",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "authority",
            "type": "address"
          }
        ],
        "name": "LogSetAuthority",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "LogSetOwner",
        "type": "event"
      },
      {
        "anonymous": true,
        "inputs": [
          {
            "indexed": true,
            "name": "sig",
            "type": "bytes4"
          },
          {
            "indexed": true,
            "name": "guy",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "foo",
            "type": "bytes32"
          },
          {
            "indexed": true,
            "name": "bar",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "name": "wad",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "fax",
            "type": "bytes"
          }
        ],
        "name": "LogNote",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "src",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "guy",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "src",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "dst",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "wad",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      }
    ]).at('0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0');

    // @ts-ignore
    MyContract.transferFrom['address,address,uint256,bytes'](account, '0xdBC888D701167Cbfb86486C516AafBeFC3A4de6e', '1000000000000000000', '0x2ad7b504ddbe25a05647312daa8d0bbbafba360686241b7e193ca90f9b01f95faa', { from: account }, (e, txhash) => {
      TxHash = txhash;
      $("#initDarwiniaTxhash").val(txhash);
      $('#txHash').html(`txHash: <a target="_blank" href="https://ropsten.etherscan.io/tx/${txhash}">${txhash}</a>`)
    })
  }
}


function startRelayServer() {
  $.ajax({
    type: "POST",
    url: "/startrelay",
    contentType: "application/json;charset=utf-8",
    dataType: "json",
    success: function (message) {
      console.log('startRelayServer', message);
      getRelayServer();
    },
    error: function (message) {
      console.log('startRelayServer', message);
    }
  });
}

function stopRelayServer() {
  $.ajax({
    type: "POST",
    url: "/stoprelay",
    contentType: "application/json;charset=utf-8",
    dataType: "json",
    success: function (message) {
      console.log('stopRelayServer', message)
      getRelayServer();
    },
    error: function (message) {
      console.log('stopRelayServer', message)
    }
  });
}

function getRelayServer() {
  $.ajax({
    type: "POST",
    url: "/getrelay",
    contentType: "application/json;charset=utf-8",
    dataType: "json",
    success: function (message) {
      console.log('getRelayServer', message)

      $("#serverStatus").text("Status: " + (message.data ? "Running" : "Stop"))
    },
    error: function (message) {
      console.log('getRelayServer', message)
    }
  });
}

function checkReceipt() {
  $.ajax({
    type: "GET",
    url: "https://alpha.evolution.land/api/darwinia/receipt?tx=" + $("#initDarwiniaTxhash").val().toString(),
    contentType: "application/json;charset=utf-8",
    dataType: "json",
    success: function (message) {
      console.log('getreceipt', message)
      $.ajax({
        type: "POST",
        url: "/checkreceipt",
        contentType: "application/json",
        data:JSON.stringify({
          ...message.data
        }),
        dataType: "json",
        success: function (message) {
          console.log('checkreceipt', message)
          $("#darwiniaHash").html(`txHash: <a target="_blank" href="https://icefrog.subscan.io/block/${message.data}">${message.data}</a>`);
        },
        error: function (message) {
          console.log('checkreceipt', message)
        }
      });

    },
    error: function (message) {
      console.log('getreceipt', message)
    }
  });
}
