const Transaction = require('@ethereumjs/tx').Transaction // please install before, `npm install @ethereumjs/tx`.
const Common = require('@ethereumjs/common').default // please install before, `npm install @ethereumjs/common`.
const Web3 = require('web3') // please install before, `npm install web3`.
const rlp = require('rlp') // please install before, `npm install rlp`.

const serializeSignedTx = (txParams) => {
  const common = new Common({chain: 'mainnet'})
  const tx = Transaction.fromTxData(txParams, {common})

  const privateKey = Buffer.from(
    'e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109',
    'hex',
  )

  const signedTx = tx.sign(privateKey)
  const serializedTx = signedTx.serialize()
  return serializedTx
}

const sendEthParams = {
  nonce: '0xFF',
  gasPrice: '0x' + parseInt(Web3.utils.toWei('120', 'gwei')).toString(16),
  gasLimit: '0x' + (parseInt('21000').toString(16)),
  to: '0xA929Bd1dC1dC0DfA244F99350B9b698c9b493770',
  value: '0x' + parseInt(Web3.utils.toWei('0.5')).toString(16),
  // data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
}

BASE_GAS = 21000
ERC20_USEDGAS = 53966
// BLOCK_GAS_LIMIT = 12500000
BLOCK_GAS_LIMIT = 10000000

// sample of https://etherscan.io/tx/0xce4b5ef73ca5a762880aa745dfc61f06dcae378bb9ee44b119407c42af7229be
const sendERC20Params = {
  nonce: '0xFF',
  gasPrice: '0x' + parseInt(Web3.utils.toWei('268', 'gwei')).toString(16),
  gasLimit: '0x' + (ERC20_USEDGAS.toString(16)), // send erc20token to new address.
  to: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
  value: '0x00',
  data: '0xa9059cbb000000000000000000000000ce605c968b89eeb7d2e6a5ced07daae5649f47b400000000000000000000000000000000000000000000000091cde02f6bafc000',
}

const toBuf = (hexStr) => Buffer.from(hexStr, "hex")
const sendEthReceipt = [
  new Web3.utils.BN(21000).toBuffer("BE", 8), // Cumulative gas Ru.
  [], // the transaction log Rl. in this case it is empty.
  // Buffer.alloc(256), // the bloome filter Rb. it is always 2048bits.
  1 // the result status code Rz.
]

// sample of https://etherscan.io/tx/0xce4b5ef73ca5a762880aa745dfc61f06dcae378bb9ee44b119407c42af7229be
const sendERC20Recipt = [
  new Web3.utils.BN(53966).toBuffer("BE", 8), // Cumulative gas Ru.
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

const sendEthTxTotalSize = () => {
  const tx_count = parseInt(BLOCK_GAS_LIMIT / BASE_GAS)
  const tx_size = serializeSignedTx(sendEthParams).length

  return tx_count * tx_size
}

const sendERC20TxTotalSize = () => {
  const tx_count = parseInt(BLOCK_GAS_LIMIT / ERC20_USEDGAS)
  const tx_size = serializeSignedTx(sendERC20Params).length

  return tx_count * tx_size
}

const ERC20is20PerAllLeftSendEthSize = () => {
  const erc20TotalGas = BLOCK_GAS_LIMIT / 5
  const erc20tx_count = parseInt(erc20TotalGas / ERC20_USEDGAS) + 1
  const leftGas = BLOCK_GAS_LIMIT - (ERC20_USEDGAS * erc20tx_count)
  const send_ethtx_count = parseInt(leftGas / BASE_GAS)

  const erc20tx_size = serializeSignedTx(sendERC20Params).length
  const send_ethtx_size = serializeSignedTx(sendEthParams).length

  const total_size = erc20tx_size * erc20tx_count + send_ethtx_size * send_ethtx_count

  console.log("erc20tx_count=", erc20tx_count, " ethtx_count=", send_ethtx_count)

  return total_size
}

const ERC20is80PerAllLeftSendEthSize = () => {
  const send_eth_total_gas = BLOCK_GAS_LIMIT / 5
  const send_ethtx_count = parseInt(send_eth_total_gas / BASE_GAS) + 1
  const leftGas = BLOCK_GAS_LIMIT - (BASE_GAS * send_ethtx_count)
  const erc20tx_count = parseInt(leftGas / ERC20_USEDGAS)

  const erc20tx_size = serializeSignedTx(sendERC20Params).length
  const send_ethtx_size = serializeSignedTx(sendEthParams).length

  const total_size = erc20tx_size * erc20tx_count + send_ethtx_size * send_ethtx_count

  console.log("erc20tx_count=", erc20tx_count, " ethtx_count=", send_ethtx_count)

  return total_size
}

console.log('send eth serializedTx.length=', serializeSignedTx(sendEthParams).length)
console.log('send ERC20 serializedTx.length=', serializeSignedTx(sendERC20Params).length)

console.log('base send eth only tx count=', parseInt(12500000 / BASE_GAS))
console.log('ERC20 only tx count=', parseInt(12500000 / ERC20_USEDGAS))

const sendEthReceiptRLP = rlp.encode(sendEthReceipt)
const sendERC20ReceiptRLP = rlp.encode(sendERC20Recipt)
console.log("send eth receipt RLP length=", sendEthReceiptRLP.length)
console.log("send ERC20 receipt RLP length=", sendERC20ReceiptRLP.length)

console.log('base send eth block size=', sendEthTxTotalSize())
console.log('ERC20 only block size=', sendERC20TxTotalSize())
console.log('ERC20 is 20% all left is send eth block size=', ERC20is20PerAllLeftSendEthSize())
console.log('ERC20 is 80% all left is send eth block size=', ERC20is80PerAllLeftSendEthSize())