import * as rlp from 'rlp' // please install before, `npm install rlp`.

const toBuf = (hexStr:String) => Buffer.from(hexStr, "hex")
const sendEthReceipt = [
  21000, // Cumulative gas Ru.
  [], // the transaction log Rl. in this case it is empty.
  // Buffer.alloc(256), // the bloome filter Rb. it is always 2048bits.
  1 // the result status code Rz.
]

// sample of https://etherscan.io/tx/0xce4b5ef73ca5a762880aa745dfc61f06dcae378bb9ee44b119407c42af7229be
const sendERC20Recipt = [
  53966, // Cumulative gas Ru.
  [toBuf("b8c77482e45f1f44de1745f52c74426c631bdd52"), // address of this log creator. Oa
    [ // The topics of this log Ot0, Ot1, ... Otn.
      toBuf("ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"),
      toBuf("0000000000000000000000008e0df04d75ff337541133295a7a982406eda6afb"),
      toBuf("000000000000000000000000ce605c968b89eeb7d2e6a5ced07daae5649f47b4")
    ],
      toBuf("00000000000000000000000000000000000000000000000091cde02f6bafc000") // The log data Od.
  ], // the erc20 transfer log.
  // Buffer.alloc(256), // the bloome filter Rb. it is always 2048bits.
  1 // the result status code Rz.
]

const sendEthReceiptRLP = rlp.encode(sendEthReceipt)
const sendERC20ReceiptRLP = rlp.encode(sendERC20Recipt)
console.log("send eth receipt RLP length=", sendEthReceiptRLP.length)
console.log("send ERC20 receipt RLP length=", sendERC20ReceiptRLP.length)

// send eth = 216000 bytes
// send erc20 = 132305 + 7115 = 139420 bytes