import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import fs from "fs";
import axios from "axios";

// This script polls Polymarket for results and settles markets on Solana
async function runOracle() {
    // 1. Setup Provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const idl = JSON.parse(fs.readFileSync("./target/idl/sports_prediction.json", "utf8"));
    const programId = new PublicKey("GvC6eD5B6z9M1vRzT1p7fQyYvA5xP7Z1aB2c3D4e5F6g"); // UPDATE THIS
    const program = new Program(idl, programId, provider);

    console.log("Oracle Worker Started...");

    // Infinite loop
    while (true) {
        try {
            console.log("Checking markets for settlement...");

            // Fetch open markets from our API (the one the frontend uses)
            const res = await axios.get("http://localhost:3000/api/markets");
            const markets = res.data;

            for (const m of markets) {
                // Logic to determine if a market is settled on Polymarket
                // Usually we check if the market status is 'closed' and who won
                // For this demo/setup, we'll look for a 'winner' field or similar

                // This is where the magic happens:
                // if (m.status === 'closed' && m.outcome !== null) {
                //    const winningOutcome = m.outcome === 'A' ? 0 : 1;
                //    await settleOnChain(program, m.id, winningOutcome);
                // }
            }

        } catch (e) {
            console.error("Worker Error:", e);
        }

        // Wait 5 minutes
        await new Promise(r => setTimeout(r, 60000 * 5));
    }
}

async function settleOnChain(program: any, eventId: string, winningOutcome: number) {
    const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from(eventId)],
        program.programId
    );

    try {
        const tx = await program.methods
            .settleMarket(winningOutcome)
            .accounts({
                market: marketPda,
                authority: program.provider.publicKey,
            })
            .rpc();

        console.log(`Settled market ${eventId} with outcome ${winningOutcome}. TX: ${tx}`);
    } catch (e) {
        console.error(`Failed to settle ${eventId}:`, e);
    }
}

// runOracle();
