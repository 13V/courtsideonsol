"use client";

import { useSportsProgram } from "./useSportsProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useState } from "react";

export const useBetting = () => {
    const { program } = useSportsProgram();
    const { publicKey } = useWallet();
    const [isTxPending, setIsTxPending] = useState(false);

    const placeBet = async (marketId: string, outcomeId: number, amountSol: number) => {
        if (!program || !publicKey) {
            alert("Please connect your wallet first!");
            return;
        }

        setIsTxPending(true);
        try {
            // 1. Derive Market PDA
            const [marketPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("market"), Buffer.from(marketId)],
                program.programId
            );

            // 2. Derive Vault PDA
            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), marketPda.toBuffer()],
                program.programId
            );

            // 3. Derive UserBet PDA
            const [userBetPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("bet"), marketPda.toBuffer(), publicKey.toBuffer()],
                program.programId
            );

            const amount = new BN(amountSol * LAMPORTS_PER_SOL);

            const tx = await program.methods
                .placeBet(outcomeId, amount)
                .accounts({
                    market: marketPda,
                    vault: vaultPda,
                    userBet: userBetPda,
                    user: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("Bet placed! TX:", tx);
            return tx;
        } catch (error) {
            console.error("Error placing bet:", error);
            throw error;
        } finally {
            setIsTxPending(false);
        }
    };

    const claimWinnings = async (marketId: string, devWallet: string, owner: string) => {
        if (!program || !publicKey) return;

        setIsTxPending(true);
        try {
            const [marketPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("market"), Buffer.from(marketId)],
                program.programId
            );

            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), marketPda.toBuffer()],
                program.programId
            );

            const [userBetPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("bet"), marketPda.toBuffer(), publicKey.toBuffer()],
                program.programId
            );

            const tx = await program.methods
                .claimWinnings()
                .accounts({
                    market: marketPda,
                    vault: vaultPda,
                    devWallet: new PublicKey(devWallet),
                    userBet: userBetPda,
                    user: publicKey,
                    owner: new PublicKey(owner),
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("Winnings claimed! TX:", tx);
            return tx;
        } catch (error) {
            console.error("Error claiming winnings:", error);
            throw error;
        } finally {
            setIsTxPending(false);
        }
    };

    return { placeBet, claimWinnings, isTxPending };
};
