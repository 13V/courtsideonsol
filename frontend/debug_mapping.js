const { Program, AnchorProvider } = require('@coral-xyz/anchor');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const idl = require('./app/idl/sports_prediction.json');

const PROGRAM_ID = '5oCaNW77tTwpAdZqhyebZ73zwm1DtfR3Ye7Cy9VWyqtT';
const RPC_URL = 'https://api.mainnet-beta.solana.com';

async function checkState() {
    const connection = new Connection(RPC_URL, 'confirmed');
    const wallet = {
        publicKey: Keypair.generate().publicKey,
        signTransaction: async (t) => t,
        signAllTransactions: async (t) => t
    };
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
    const program = new Program(idl, provider);

    console.log("Program initialized successfully.");

    try {
        const markets = await program.account.market.all();
        console.log(`Found ${markets.length} markets.`);
        if (markets.length > 0) {
            console.log("First market account structure (all keys):");
            console.log(Object.keys(markets[0].account));
            console.log("Full data for first market:");
            console.log(JSON.stringify(markets[0].account, null, 2));
        }
    } catch (e) {
        console.error("Failed to fetch markets:", e);
    }
}

checkState();
