import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import idl from "./app/idl/sports_prediction.json";

async function listMarkets() {
    const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=026544e2-2acd-499a-84f1-51d00ecbb3f9", "confirmed");
    const provider = new anchor.AnchorProvider(connection, {} as any, { preflightCommitment: "confirmed" });
    const program = new Program(idl as any, provider);

    const markets = await (program.account as any).market.all();
    console.log("On-Chain Markets:");
    markets.forEach((m: any) => {
        console.log(`- PDA: ${m.publicKey.toBase58()}`);
        console.log(`  EventID: ${m.account.eventId}`);
        console.log(`  Status: ${JSON.stringify(m.account.status)}`);
    });
}

listMarkets().catch(console.error);
