let Transport =  require("@ledgerhq/hw-transport-node-hid").default;
let AppBtc = require("@ledgerhq/hw-app-btc").default;
let bitcoinjs = require('bitcoinjs-lib');

// Wallet Words - public OK
// merge alley   lucky   axis penalty manage latin   gasp  virus    captain wheel deal
// chase fragile chapter boss zero    dirt   stadium tooth physical valve   kid   plunge

// on testnet3
// 2NDPPe5oBaxBG5ARf24up6bm6R9kf1zSLna -> 2N89ApyRnXjQMLvuakHa49sppidoF7PMp8r

// pulled from bitcoind
// bitcoin-cli getrawtransaction "ff2ba09d4bb83ac3599260a6e14381014772f0a8cf464f266971b2a4f08214df"
// bitcoin-cli getrawtransaction "90f829c6313137de1ff304707afbb952098a178c62aead5a6ec4bc1e5eba2935"
// bitcoin-cli getrawtransaction "0f20b52bd58b00098f1de23f4173775240effb39bfba2ba5d818e30622ab1eb7"
let refTxs = ["02000000000101e037f6d700625d71955a375d4d84a2cbc2fab7dcc69514bbebc09439534cf8e50000000017160014849eac0f4d228da64b1b1798a6ead189e69b6cbbfeffffff0280841e000000000017a914dcede674a0652dc8d23bcbff6b100d6f4a4f7d0987bc513c000000000017a91404050b5b4fe88529ca4984a15495f46aa01be424870247304402201cb446d96ace15cff8701eff81971f54c95f1ed02ec635a0a4c2d2621a0f0bfc02204a2e076d4fd26a0bd7ae4f184dbac542496d89ca97c3550a72fd095a24c042750121026994ae6e1628cb370692b9cc84dcc8daab8075e8cc5332031547264591ab73e760f71500",
              "0200000000010221ab34bc564eddf3a4c12d12af3df0b073d6215dc1a39ebd0fcc2ae20efffcf60000000017160014944094424a9917fed5325e1826f80d6e58e983ccfeffffff77c020020f697fdd783340865b1edca5dcf59d6c72d27bdf08f69556ef4576750000000017160014ea09d1168b7c8871579cf9decc0658de206c2d44feffffff02d7482a000000000017a914e445002f132c2bbdbd9058eae07f219d9ab478aa8740420f000000000017a914dcede674a0652dc8d23bcbff6b100d6f4a4f7d09870247304402200d53328f1e6593b7e454e56c2e295eaf555a875c2b0fcb7f22f399e7ad123d820220452c32b1da49b33ed56db8386f41332ab56f997ca534adc025b85d6b46e410da012103875c949e24727c184b07aeefbf432d6fddaa4e79adc2f641c7ef5a301c48583e024830450221009a559069a380ce8d2de2cc14155b8670fcf8b9894772cd74138e7e8da6d99aa002205da2dd234286c6792280e9b0369e074141fca58693ea1c99e6a7eea804631c2a012102bb826ad832460a43178874e3b2c61d8bc120b78dda854eea74e977f684d36c0a60f71500",
              "020000000001012602d5f5fe52c977372e6b66e07ad26a1a89ef00024da4c69f7a9d5be8f1017101000000171600148546f12f7c3b83896625362e30cdb9f62663445ffeffffff022e5945000000000017a914eaa40ee6e9608ee888e9ecd60a9e089a3638a61687c0c62d000000000017a914dcede674a0652dc8d23bcbff6b100d6f4a4f7d098702483045022100af4b1dc203d7e967699d6017e121070ce65525733076e273b97c2cfc5a7733350220448bc727c8c181ace6be343a7539ed4ae6365ff8de5d3743dbf0d2780f181b7701210323f11a5caa673372f1a137d3ec8e0a50d16def26f1ebb63b0c03fd819032dcc860f71500"
              ]

let inputIndices = [0,1,1]

// pulled from Ledger, could add an additional check that the redeem script matches
// the address
let pubKeys = ["02c7db958f1a95c663c1ee4bf360633eedc6c30adafbdbd74abf9c210f79ffb2c2",
               "03354cedc2096540401373223117947709506c98aecc7a36fb40b6fdf861437438",
               "036bfc2942e69c7c6be5605dbdab6bc4980a33d4e7f59d1db97d6c01183ef1e8e1"]


// Created by bitcoind 'createrawtransaction'
// bitcoin-cli createrawtransaction "[{\"vout\": 0, \"txid\": \"ff2ba09d4bb83ac3599260a6e14381014772f0a8cf464f266971b2a4f08214df\"}, {\"vout\": 1, \"txid\": \"90f829c6313137de1ff304707afbb952098a178c62aead5a6ec4bc1e5eba2935\"}, {\"vout\": 1, \"txid\": \"0f20b52bd58b00098f1de23f4173775240effb39bfba2ba5d818e30622ab1eb7\"}]" "{\"2N89ApyRnXjQMLvuakHa49sppidoF7PMp8r\": 0.05976625}"

unsignedSerializedTx = "0100000003df1482f0a4b27169264f46cfa8f07247018143e1a6609259c33ab84b9da02bff0000000000ffffffff3529ba5e1ebcc46e5aadae628c178a0952b9fb7a7004f31fde373131c629f8900100000000ffffffffb71eab2206e318d8a52bbabf39fbef40527773413fe21d8f09008bd52bb5200f0100000000ffffffff0131325b000000000017a914a364c0b1f4ae703a761df2fb57da1b4520ee595b8700000000"

let bip32_1 = "44'/1'/1'/20/45"
let bip32_2 = "44'/1'/2'/20/46"
let bip32_3 = "44'/1'/0'/20/51" // not used for signing
    
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
    // we could pull these from the ledger and verify the address is correct if we want.


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

//let onesig = signOneTx(bip32_1, unsignedSerializedTx, pubKeys, refTxs, inputIndices)
let twosig =  signOneTx(bip32_2, unsignedSerializedTx, pubKeys, refTxs, inputIndices)


//expected sig1: ["30440220739c78c5d4cb631300352b8cb2ab923b4846b91b73b920b1401b34a1c5d846be02201d35cc5829aecb26d5b08c219b1be3021ff0688d6f3456ccc1d2770472788dd2",
//                "3045022100c36159377a44b23598971ae58072c8d45d7acf30cb1067350a6889131cb6491202207862ebad68b649425fe587caafbfcac33e869093a9578ca7f1de89182b0f5646",
//                "304402201a3fa4f3585752422a9228ce86ef53f217200a07fec7d2e867206513a5d902bf02206924fcf3575554c62a202a75a3000defc11045f8430d59251067877546964ccb"]

//expected sig2: ["304402201d537c16f549af181b0689a762443f404a0d845bc7c1e109dc25eb0c2ee82d0a02206ffbb428adf477aacaa65b1f24a32072b4f602b67cefbaf86092d3081a438c79",
//                "304402207702df8cde179532ba7d10f11a61a7b647187699ae28e4120e910f939636196b02207eab45f7cef41b33c18989f443159ad370a615a29e20c328184ddbd52e7b0e46",
//                "3045022100f9a153a893da0769f9f3cb094c3b7c45c158a7a48638185877e844c61dc88f98022041dd9dcace05aca51f2fda27150756a5d969e0e494e3f21cef1b245cea3cd88e"]

// on-chain at 29649566ce0c3e291736908acc3be28f5c08129cd18d2421061cc2d5603d7de0
// 
// 0100000003df1482f0a4b27169264f46cfa8f07247018143e1a6609259c33ab84b9da02bff00000000fc004730440220739c78c5d4cb631300352b8cb2ab923b4846b91b73b920b1401b34a1c5d846be02201d35cc5829aecb26d5b08c219b1be3021ff0688d6f3456ccc1d2770472788dd20147304402201d537c16f549af181b0689a762443f404a0d845bc7c1e109dc25eb0c2ee82d0a02206ffbb428adf477aacaa65b1f24a32072b4f602b67cefbaf86092d3081a438c79014c69522102c7db958f1a95c663c1ee4bf360633eedc6c30adafbdbd74abf9c210f79ffb2c22103354cedc2096540401373223117947709506c98aecc7a36fb40b6fdf86143743821036bfc2942e69c7c6be5605dbdab6bc4980a33d4e7f59d1db97d6c01183ef1e8e153aeffffffff3529ba5e1ebcc46e5aadae628c178a0952b9fb7a7004f31fde373131c629f89001000000fdfd0000483045022100c36159377a44b23598971ae58072c8d45d7acf30cb1067350a6889131cb6491202207862ebad68b649425fe587caafbfcac33e869093a9578ca7f1de89182b0f56460147304402207702df8cde179532ba7d10f11a61a7b647187699ae28e4120e910f939636196b02207eab45f7cef41b33c18989f443159ad370a615a29e20c328184ddbd52e7b0e46014c69522102c7db958f1a95c663c1ee4bf360633eedc6c30adafbdbd74abf9c210f79ffb2c22103354cedc2096540401373223117947709506c98aecc7a36fb40b6fdf86143743821036bfc2942e69c7c6be5605dbdab6bc4980a33d4e7f59d1db97d6c01183ef1e8e153aeffffffffb71eab2206e318d8a52bbabf39fbef40527773413fe21d8f09008bd52bb5200f01000000fdfd000047304402201a3fa4f3585752422a9228ce86ef53f217200a07fec7d2e867206513a5d902bf02206924fcf3575554c62a202a75a3000defc11045f8430d59251067877546964ccb01483045022100f9a153a893da0769f9f3cb094c3b7c45c158a7a48638185877e844c61dc88f98022041dd9dcace05aca51f2fda27150756a5d969e0e494e3f21cef1b245cea3cd88e014c69522102c7db958f1a95c663c1ee4bf360633eedc6c30adafbdbd74abf9c210f79ffb2c22103354cedc2096540401373223117947709506c98aecc7a36fb40b6fdf86143743821036bfc2942e69c7c6be5605dbdab6bc4980a33d4e7f59d1db97d6c01183ef1e8e153aeffffffff0131325b000000000017a914a364c0b1f4ae703a761df2fb57da1b4520ee595b8700000000
