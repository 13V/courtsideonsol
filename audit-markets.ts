import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "./app/idl/sports_prediction.json";
import * as fs from 'fs';

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=026544e2-2acd-499a-84f1-51d00ecbb3f9";
const PROGRAM_ID = new PublicKey("5oCaNW77tTwpAdZqhyebZ73zwm1DtfR3Ye7Cy9VWyqtT");

async function diagnose() {
    console.log("Diagnosing Program:", PROGRAM_ID.toBase58());
    const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(anchor.web3.Keypair.generate()), { preflightCommitment: "confirmed" });
    const program = new Program(idl as any, provider);

    try {
        const markets = await (program.account as any).market.all();
        let output = `Found ${markets.length} total markets.\n`;
        markets.forEach((m: any) => {
            output += `- EventID: ${m.account.eventId}\n`;
            output += `  PK: ${m.publicKey.toBase58()}\n`;
            output += `  Status: ${JSON.stringify(m.account.status)}\n`;
            output += `  Authority: ${m.account.authority.toBase58()}\n`;
            output += `  DevWallet: ${m.account.devWallet.toBase58()}\n`;
            output += `  -----------------------------------\n`;
        });
        fs.writeFileSync('market_audit.txt', output, 'utf8');
        console.log("Audit written to market_audit.txt");
    } catch (err) {
        console.error("Diagnosis Failed:", err);
    }
}

diagnose();
