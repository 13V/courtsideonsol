import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import fetch from "node-fetch";
import idl from "../app/idl/sports_prediction.json";
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURATION ---
const RPC_URL = process.env.RPC_URL || "https://mainnet.helius-rpc.com/?api-key=026544e2-2acd-499a-84f1-51d00ecbb3f9";
const PROGRAM_ID = new PublicKey("5oCaNW77tTwpAdZqhyebZ73zwm1DtfR3Ye7Cy9VWyqtT");
const POLL_INTERVAL = 60000; // 1 minute

import bs58 from "bs58";

// For the cranker to work, it needs the Authority's Keypair.
const getAuthorityKeypair = (): Keypair => {
    // Priority 1: Environment Variable
    if (process.env.AUTHORITY_KEY) {
        const raw = process.env.AUTHORITY_KEY.trim();
        if (raw.startsWith('[')) {
            return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
        }
        return Keypair.fromSecretKey(bs58.decode(raw));
    }

    // Priority 2: Local authority.json or authority.txt
    const devKeyPath = path.join(__dirname, 'authority.json');
    const devTxtPath = path.join(__dirname, 'authority.txt');

    console.log(`Cranker: Looking for keys in: \n  - ${devKeyPath}\n  - ${devTxtPath}`);

    let keyData = "";
    if (fs.existsSync(devKeyPath)) {
        console.log(`Cranker: Found authority.json`);
        keyData = fs.readFileSync(devKeyPath, 'utf-8').trim();
    } else if (fs.existsSync(devTxtPath)) {
        console.log(`Cranker: Found authority.txt`);
        keyData = fs.readFileSync(devTxtPath, 'utf-8').trim();
    }

    if (keyData) {
        console.log(`Cranker: Using authority key from local file... (length: ${keyData.length})`);
        try {
            if (keyData.startsWith('[')) {
                return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keyData)));
            }
            const decoded = bs58.decode(keyData);
            console.log(`Cranker: Decoded key length: ${decoded.length} bytes`);
            return Keypair.fromSecretKey(decoded);
        } catch (e: any) {
            console.error(`Cranker: FAILED TO DECODE KEY: ${e.message}`);
            throw e;
        }
    }

    // Priority 3: Local id.json (standard Solana CLI path)
    const home = process.env.HOME || process.env.USERPROFILE;
    const localKeyPath = path.join(home!, '.config', 'solana', 'id.json');
    if (fs.existsSync(localKeyPath)) {
        console.log(`Cranker: Using authority key from ${localKeyPath}`);
        return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(localKeyPath, 'utf-8'))));
    }

    throw new Error("No authority key found. Please set AUTHORITY_KEY env or have ~/.config/solana/id.json");
};

async function runCranker() {
    console.log("-----------------------------------------");
    console.log("🚀 POLYBET AUTO-CRANKER STARTING...");
    console.log(`📍 RPC: ${RPC_URL}`);
    console.log(`🛠️ PROGRAM: ${PROGRAM_ID.toBase58()}`);
    console.log("-----------------------------------------");

    const authority = getAuthorityKeypair();
    const connection = new anchor.web3.Connection(RPC_URL, "confirmed");
    const wallet = new anchor.Wallet(authority);
    const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: "confirmed" });
    const program = new Program(idl as any, provider);

    const crank = async () => {
        try {
            console.log(`\n[${new Date().toLocaleTimeString()}] Checking Arena...`);

            // 1. Fetch all on-chain markets
            const markets = await (program.account as any).market.all();
            const openMarkets = markets.filter((m: any) => m.account.status.open !== undefined);

            if (openMarkets.length === 0) {
                console.log("Arena: No open markets found. Waiting...");
                return;
            }

            console.log(`Arena: Found ${openMarkets.length} open markets on-chain.`);

            // 2. Fetch ESPN Scoreboard
            const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');
            const data: any = await response.json();

            if (!data.events) {
                console.log("ESPN: No events found in feed.");
                return;
            }

            // 3. Match and Settle
            for (const market of openMarkets) {
                const eventId = market.account.eventId;

                // Find matching event in ESPN feed
                const event = data.events.find((e: any) => {
                    const comp = e.competitions?.[0];
                    if (!comp) return false;

                    // 1. Check ID or Slug overlap
                    const eId = e.id.toUpperCase();
                    const eSlug = (e.slug || "").toUpperCase();
                    const eventIdNorm = eventId.toUpperCase();

                    // GET TEAM NAMES FROM ESPN
                    const homeTeam = comp.competitors.find((c: any) => c.homeAway === 'home')?.team?.abbreviation?.toUpperCase();
                    const awayTeam = comp.competitors.find((c: any) => c.homeAway === 'away')?.team?.abbreviation?.toUpperCase();

                    if (!homeTeam || !awayTeam) return false;

                    // STRICT MATCH: Both teams must be present in the eventId slug
                    const teamsMatch = eventIdNorm.includes(homeTeam) && eventIdNorm.includes(awayTeam);

                    // ID Match (only if non-empty)
                    const idMatch = (eId && eventIdNorm.includes(eId)) ||
                        (eSlug && eSlug.includes(eventIdNorm)) ||
                        (eSlug && eventIdNorm.includes(eSlug));

                    // MUST match at least one criteria AND it must be a non-empty match
                    if (!teamsMatch && !idMatch) return false;

                    console.log(`  [POTENTIAL MATCH] Market ${eventId} vs Event ${eSlug} (ID: ${eId})`);
                    console.log(`  Teams: ${awayTeam} @ ${homeTeam} | Matches: ${teamsMatch} | ID: ${idMatch}`);

                    // 2. DATE VALIDATION (CRITICAL)
                    const dateMatch = eventId.match(/\d{4}-\d{2}-\d{2}/);
                    if (dateMatch) {
                        const marketDate = dateMatch[0];
                        const eventDate = e.date?.split('T')[0]; // ESPN format: "2025-12-28T..."

                        if (marketDate !== eventDate) {
                            console.log(`  [SKIP] Date Mismatch (${marketDate} vs ${eventDate})`);
                            return false;
                        }
                        console.log(`  [DATE MATCH] Confirmed ${marketDate}`);
                    }

                    return true;
                });

                if (!event) {
                    console.log(`  - Market ${eventId}: No match in live feed yet.`);
                    continue;
                }

                const eventStatus = event.status?.type?.name;
                if (eventStatus === 'STATUS_FINAL') {
                    console.log(`  🎯 MATCH FOUND & VALIDATED! Game ${eventId} is finished.`);

                    const comp = event.competitions[0];
                    const homeComp = comp.competitors.find((c: any) => c.homeAway === 'home');
                    const awayComp = comp.competitors.find((c: any) => c.homeAway === 'away');

                    const homeScore = parseInt(homeComp.score);
                    const awayScore = parseInt(awayComp.score);

                    const winningOutcome = homeScore > awayScore ? 0 : 1;
                    const winnerName = winningOutcome === 0 ? "HOME" : "AWAY";

                    console.log(`  ⚖️  Result: ${homeScore} - ${awayScore} (${winnerName} wins)`);
                    console.log(`  ⛓️  Submitting on-chain settlement for ${eventId}...`);

                    try {
                        const tx = await program.methods
                            .settleMarket(winningOutcome)
                            .accounts({
                                market: market.publicKey,
                                authority: authority.publicKey,
                            })
                            .rpc();

                        console.log(`  ✅ SETTLED! Transaction: ${tx}`);
                    } catch (err: any) {
                        console.error(`  ❌ Failed to settle ${eventId}:`, err.message);
                    }
                } else {
                    console.log(`  - Market ${eventId}: Game in progress (${event.status?.type?.detail}).`);
                }
            }

        } catch (error) {
            console.error("Cranker Error:", error);
        }
    };

    // Run immediately then poll
    await crank();
    setInterval(crank, POLL_INTERVAL);
}

runCranker().catch(err => {
    console.error("Fatal Cranker Error:", err);
    process.exit(1);
});
