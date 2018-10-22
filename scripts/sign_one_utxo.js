let Transport =  require("@ledgerhq/hw-transport-node-hid").default;
let AppBtc = require("@ledgerhq/hw-app-btc").default;
let bitcoinjs = require('bitcoinjs-lib');

// Wallet Words - public OK
// merge alley   lucky   axis penalty manage latin   gasp  virus    captain wheel deal
// chase fragile chapter boss zero    dirt   stadium tooth physical valve   kid   plunge

// on testnet3
// 2MsGFrBYMjX3RMMUGKmt8YM89dvrptULDuU -> 2N89ApyRnXjQMLvuakHa49sppidoF7PMp8r

// pulled from bitcoind
// bitcoin-cli getrawtransaction "8e5d584bf8cb37427a8c36bd0e2a2d4eb54aa46212507c2dad53995b67e4e3d0"
let refTxs = ["02000000000101775ace0f1249855d8b3264857fb7686882fca4a5f6b5873a32bc7e52713097080000000017160014556ab17e7d12648fb45620a18103bd6d812d5254feffffff0240420f000000000017a9140031f8087926169f285ebc2cbfd0f4a67e0b097a87e7611e000000000017a9145c2670e790eb16ad99ffa7f110213a0b41f5c0c58702473044022053221259b97d7d9dbeb94f55018eae9187f40e7044a7f111239dbe6f6e7762bf0220415321332a9d4b85fdfe8a112caea5ae0521b94f863830c1afbb69cc60fe4de5012102ad72ec0764a913126ea47db28a21f4eb90a573c6cdcf1c73bc8446a1be079f1e60f71500"]

let inputIndices = [0]

// pulled from Ledger, could add an additional check that the redeem script matches
// the address
let pubKeys = ["03a6f4d33d9e40db860c85cfc2f6380b28fa7c0ff9209e86fb44b6b185db01b9f5",
               "02c4a715679d000b6c0e194601ee0fc238701955270abf4bf4f7b87c385e2d5e7c",
               "03af1e0c2950d9dbda795803b5f589ab2176bc8c8a0170ee5093797ed7ca477655"]


// Created by bitcoind 'createrawtransaction'
// bitcoin-cli createrawtransaction "[{\"vout\": 0, \"txid\": \"8e5d584bf8cb37427a8c36bd0e2a2d4eb54aa46212507c2dad53995b67e4e3d0\"}]" "{\"2N89ApyRnXjQMLvuakHa49sppidoF7PMp8r\": 0.00991475}"
unsignedSerializedTx = "0100000001d0e3e4675b9953ad2d7c501262a44ab54e2d2a0ebd368c7a4237cbf84b585d8e0000000000ffffffff01f3200f000000000017a914a364c0b1f4ae703a761df2fb57da1b4520ee595b8700000000"

let bip32_1 = "44'/1'/1'/20/44"
let bip32_2 = "44'/1'/2'/20/45"
let bip32_3 = "44'/1'/0'/20/50" // not used for signing
    
async function signOneTx(bip32_path, unsignedSerializedTx, pubKeys, refTxs, inputIndices) {
    let transport = await Transport.create();
    transport.setDebugMode(true);
    let ledgerbtc = await new AppBtc(transport);

   
    // OUTPUT    
    let outputTx = await ledgerbtc.splitTransaction(unsignedSerializedTx);
    let outputScriptHex = await ledgerbtc.serializeTransactionOutputs(outputTx).toString('hex');

    // REDEEM SCRIPT
    let m = 2
    let pubKeysBin = pubKeys.map((pubKey) => Buffer.from(pubKey, 'hex'));
    let redeemScriptHex = bitcoinjs.script.multisig.output.encode(m, pubKeysBin).toString('hex');


    // INPUTS
    let ledgerInputs = []; // array[tx, index, redeemscript]
    let splitTx;    
    for (var i = 0; i < refTxs.length; i++) {
        splitTx = await ledgerbtc.splitTransaction(refTxs[i], true);
        ledgerInputs[i] = [splitTx, inputIndices[i], redeemScriptHex];
    }

    // KEYSETS
    let ledgerKeySets = Array(refTxs.length).fill(bip32_path); //array[bip32]
    
    console.log("LEDGERINPUTS", ledgerInputs);
    console.log("LEDGERKEYSETS", ledgerKeySets);
    console.log("LEDGERSCRIPTHEX", outputScriptHex);            
    
    let result = await ledgerbtc.signP2SHTransaction(
        ledgerInputs,
        ledgerKeySets,
        outputScriptHex
    );
    console.info("Successfully signed message: ", result);
    return result[0]
}

let onesig = signOneTx(bip32_1, unsignedSerializedTx, pubKeys, refTxs, inputIndices)
//let twosig =  signOneTx(bip32_2, unsignedSerializedTx, pubKeys, refTxs, inputIndices)


//expected sig1: 3045022100e91096cd378c954140b5569412dbfa40474e23f55df11f8de1ffd8cf1fb78ef402203516859c9011bdf87acf9953af569c0a7fda1cc4e39ac4c9576091b21d47d68f
//expected sig2: 304402206a6ade50c708fa9692391efa7981f6649f43fe7483031af28642bcdd8496529d0220019bf9e3bb7ee91e77379f10d196e88bb8de4a172ff9afb0a26d1dcc6ef62fe9


// on-chain at 9e472839cacdc62a5937faed33cac27e28f32854c258b7db13e57f1d8ee29e29
// 0100000001d0e3e4675b9953ad2d7c501262a44ab54e2d2a0ebd368c7a4237cbf84b585d8e00000000fdfd0000483045022100e91096cd378c954140b5569412dbfa40474e23f55df11f8de1ffd8cf1fb78ef402203516859c9011bdf87acf9953af569c0a7fda1cc4e39ac4c9576091b21d47d68f0147304402206a6ade50c708fa9692391efa7981f6649f43fe7483031af28642bcdd8496529d0220019bf9e3bb7ee91e77379f10d196e88bb8de4a172ff9afb0a26d1dcc6ef62fe9014c69522103a6f4d33d9e40db860c85cfc2f6380b28fa7c0ff9209e86fb44b6b185db01b9f52102c4a715679d000b6c0e194601ee0fc238701955270abf4bf4f7b87c385e2d5e7c2103af1e0c2950d9dbda795803b5f589ab2176bc8c8a0170ee5093797ed7ca47765553aeffffffff01f3200f000000000017a914a364c0b1f4ae703a761df2fb57da1b4520ee595b8700000000
