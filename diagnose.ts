import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "./app/idl/sports_prediction.json";

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=026544e2-2acd-499a-84f1-51d00ecbb3f9";
const PROGRAM_ID = new PublicKey("5oCaNW77tTwpAdZqhyebZ73zwm1DtfR3Ye7Cy9VWyqtT");

async function diagnose() {
    console.log("Diagnosing Program:", PROGRAM_ID.toBase58());
    const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(anchor.web3.Keypair.generate()), { preflightCommitment: "confirmed" });
    const program = new Program(idl as any, provider);

    try {
        const markets = await (program.account as any).market.all();
        console.log(`Found ${markets.length} total markets.`);
        markets.forEach((m: any) => {
            console.log(`- Market: ${m.account.eventId} (PK: ${m.publicKey.toBase58()}) Status: ${JSON.stringify(m.account.status)}`);
        });
    } catch (err) {
        console.error("Diagnosis Failed:", err);
    }
}

diagnose();
