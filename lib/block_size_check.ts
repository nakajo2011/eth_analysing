import HDWalletProvider from '@truffle/hdwallet-provider'
const Web3 = require('web3')
const Transaction = require('@ethereumjs/tx').Transaction // please install before, `npm install @ethereumjs/tx`.
const Common = require('@ethereumjs/common').default // please install before, `npm install @ethereumjs/common`.
const rlp = require('rlp') // please install before, `npm install rlp`.

const mnemonic = 'soul head matter frost height seek aspect float sad agree web heavy'

const provider = new HDWalletProvider(mnemonic, 'http://192.168.10.2:8545')
// const provider = new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/v3/3954f55dad98472f9a67ab653bd78fb5')
const web3 = new Web3(provider)

const stringNumber2hex = (sNumber:String) => '0x' + new web3.utils.BN(sNumber).toString('hex')

const toBuf = (hexStr:String) => {
  if (hexStr.startsWith('0x')) {
    hexStr = hexStr.substr(2)
  }
  return Buffer.from(hexStr, 'hex')
}

const getTxSize = async (tx:any) => {
  // const tx = await web3.eth.getTransaction(txid)


  // console.log(JSON.stringify(tx, null, "  "))
  // process.exit(0)

  tx.gasPrice = stringNumber2hex(tx.gasPrice)
  tx.value = stringNumber2hex(tx.value)
  tx.data = tx.input
  const common = new Common({chain: 'mainnet'})
  const txObj = Transaction.fromTxData(tx, {common})

  return txObj.serialize().length
}

// Receipt RLP define
//storedReceiptRLP struct {
// 	PostStateOrStatus []byte
// 	CumulativeGasUsed uint64
// 	Logs              []*LogForStorage
// }
//
// Log RLP define
// rlp.Encode(w, rlpStorageLog{
// 		Address: l.Address,
// 		Topics:  l.Topics,
// 		Data:    l.Data,
// 	})
const getReceiptSize = async (receipt:any) => {
  // const receipt = await web3.eth.getTransactionReceipt(txid)
  const bigN = new Web3.utils.BN(receipt.cumulativeGasUsed)

  const storageLogs = receipt.logs.map((log:any) => {
    return [
      toBuf(log.address), // l.Address 20 bytes
      log.topics.map((topic:String) => toBuf(topic)), // l.Topics Hash[]
      toBuf(log.data)
    ]
  })
  const receiptBytes = [
    receipt.status == true ? 0x01 : 0x00, // PostStateOrStatus 1byte
    bigN.toBuffer('BE', 8), // CumulativeGasUsed 8byte
    storageLogs // []*LogForStorage
  ]

  const receiptRLP = rlp.encode(receiptBytes)
  return receiptRLP.length
}

const getBlockParallel = async (blockN:number) => {
  const block = await web3.eth.getBlock(blockN)
  let txs: number[] = []
  let receipts: number[] = []
  let ethSendTxs = []
  let contractTxs = []
  let txProcesses = []
  let receiptProcesses = []
  for (var i = 0; i < block.transactions.length; i++) {
    const txid = block.transactions[i]
    txProcesses.push(web3.eth.getTransaction(txid)
      .then((tx:any) => getTxSize(tx))
      .then((txSize:number) => txs.push(txSize)))

    receiptProcesses.push(web3.eth.getTransactionReceipt(txid)
      .then((receipt:any) => {
        if(receipt.gasUsed == 21000) {
          ethSendTxs.push(txid)
        } else {
          contractTxs.push(txid)
        }
        getReceiptSize(receipt)
      })
      .then((receiptSize:number) => receipts.push(receiptSize)))

  }

  // await Promise.all([...txProcesses, ...receiptProcesses])
  const promises = [...txProcesses, ...receiptProcesses]
  let start = 0
  const limit = 20
  console.log("total process=", promises.length)
  while(true) {
    const chunks = promises.slice(start, start + limit)
    console.log("chunks.length=", chunks.length)
    if(chunks.length === 0) {
      break
    }
    await Promise.all(chunks)
    start += limit
  }
  return {
    transactions: block.transactions,
    totalTxSize: txs.reduce((n, s) => n+s),
    totalReceiptSize: receipts.reduce((n, s) => n+s),
    ethSendTxCount: ethSendTxs.length,
    contractTxCount: contractTxs.length
  }
}

const getBlock = async (blockN:number) => {
  const block = await web3.eth.getBlock(blockN)
  // console.log(JSON.stringify(block, null, "  "))
  console.log(new Date(block.timestamp * 1000))

  let totalTxSize = 0
  let totalReceiptSize = 0
  let ethSendTxCount = 0
  let contractTxCount = 0

  for (var i = 0; i < block.transactions.length; i++) {
    const txid = block.transactions[i]
    const tx = await web3.eth.getTransaction(txid)
    const receipt = await web3.eth.getTransactionReceipt(txid)
    const txSize = await getTxSize(tx)

    const receiptSize = await getReceiptSize(receipt)
    if(receipt.gasUsed == 21000) {
      ethSendTxCount +=1
    } else {
      contractTxCount += 1
    }
    // console.log(i, txSize, receiptSize, block.transactions[i])
    totalTxSize += txSize
    totalReceiptSize += receiptSize
  }

  // console.log("block.transactions=", block.transactions.length)
  // console.log("txs.size=", txs.length)
  // console.log("txs.total=", txs.reduce((n:number, s:number) => n+s))
  // console.log(block)
  // console.log("transaction length=", block.transactions.length)
  // console.log("totalTxSize=", totalTxSize)
  // console.log("totalReceiptSize=", totalReceiptSize)
  // console.log("ethSendTxCount=", ethSendTxCount)
  // console.log("contractTxCount=", contractTxCount)
  // console.log("ethtx percent=", (ethSendTxCount / block.transactions.length) * 100, "%")

  return {
    transactions: block.transactions,
    totalTxSize: totalTxSize,
    totalReceiptSize: totalReceiptSize,
    ethSendTxCount: ethSendTxCount,
    contractTxCount: contractTxCount
  }
}

interface BlockInfo {
  transactions: String[],
  totalTxSize: number,
  totalReceiptSize: number,
  ethSendTxCount: number,
  contractTxCount: number
}

const getBlocks = async (startNum:number, endNum:number) => {
  const infos:BlockInfo = {
    transactions: [],
    totalTxSize: 0,
    totalReceiptSize: 0,
    ethSendTxCount: 0,
    contractTxCount: 0
  }

  for(let i=startNum; i<endNum; i++) {
    const oneBlockInfo = await getBlock(i)
    infos.transactions = infos.transactions.concat(oneBlockInfo.transactions)
    infos.totalTxSize += infos.totalTxSize
    infos.totalReceiptSize += infos.totalReceiptSize
    infos.ethSendTxCount += infos.ethSendTxCount
    infos.contractTxCount += infos.contractTxCount
  }

  console.log("================ Total Infos ===============")
  console.log("transaction length=", infos.transactions.length)
  console.log("totalTxSize=", infos.totalTxSize)
  console.log("totalReceiptSize=", infos.totalReceiptSize)
  console.log("ethSendTxCount=", infos.ethSendTxCount)
  console.log("contractTxCount=", infos.contractTxCount)
  console.log("ethtx percent=", (infos.ethSendTxCount / infos.transactions.length) * 100, "%")

  console.log("=================avalage==================")
  console.log("tx size ave=", infos.totalTxSize / infos.transactions.length)
  console.log("receipt size ave=", infos.totalReceiptSize / infos.transactions.length)
}

const main = async () => {
  // await getBlock(12290370)
  // await getBlock(999999)
  // await getReceiptSize("0xdc970404003e9508b1a703b770bbfa9efccf1d38d697bec068b2ecde8aa78d37");
  // const bigN = new Web3.utils.BN(72859)
  // console.log(bigN.toBuffer('BE', 8), bigN.toString())

  await getBlocks(12150290, 12338548)
  // await getBlock(12150290)
  process.exit(0)
}
main().then()
