"use client";

import { useSportsProgram } from "./useSportsProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useState, useCallback } from "react";

const DEV_WALLET = new PublicKey("2gJh5rZkw5czyg6xWVz1XziM3pDFp6WhqST68wSGuNg1");

export const useBetting = () => {
    const { program } = useSportsProgram();
    const { publicKey, connected } = useWallet();
    const [isTxPending, setIsTxPending] = useState(false);

    console.log("useBetting: Render state", {
        hasProgram: !!program,
        hasPk: !!publicKey,
        connected
    });

    const placeBet = async (marketId: string, outcomeId: number, amountSol: number) => {
        console.log("useBetting: placeBet attempt", {
            marketId,
            hasProgram: !!program,
            hasPublicKey: !!publicKey,
            walletConnected: connected
        });

        if (!publicKey) {
            console.error("useBetting: Interaction failed - Wallet NOT connected to frontend.");
            alert("Please connect your wallet first!");
            return;
        }

        if (!program) {
            console.error("useBetting: Interaction failed - Program NOT initialized. This usually means the wallet object wasn't passed to Anchor correctly.");
            alert("Application state error: Program not ready. Please refresh.");
            return;
        }

        setIsTxPending(true);
        try {
            // Check balance before sending
            const balance = await program.provider.connection.getBalance(publicKey);
            const minimumRequired = (amountSol * LAMPORTS_PER_SOL) + 5000000; // Bet + 0.005 SOL buffer

            if (balance < minimumRequired) {
                const balanceSol = balance / LAMPORTS_PER_SOL;
                alert(`Insufficient Balance!\n\nYou need at least ${amountSol} SOL for the bet + ~0.005 for fees.\nYour current balance: ${balanceSol.toFixed(4)} SOL`);
                setIsTxPending(false);
                return;
            }

            // 1. Derive Market PDA
            const [marketPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("market"), Buffer.from(marketId)],
                program.programId
            );

            // 2. Derive Vault PDA
            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), Buffer.from(marketId)],
                program.programId
            );

            // 3. Derive UserBet PDA
            const [userBetPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("bet"), marketPda.toBuffer(), publicKey.toBuffer()],
                program.programId
            );

            const amount = new BN(amountSol * LAMPORTS_PER_SOL);
            console.log("useBetting: Sending placeBet transaction", { marketPda: marketPda.toBase58(), outcomeId, amount: amount.toString() });

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
                [Buffer.from("vault"), Buffer.from(marketId)],
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

    const initializeMarket = async (marketId: string, endTime: number) => {
        if (!program || !publicKey) {
            alert("Connect wallet first!");
            return;
        }

        setIsTxPending(true);
        try {
            const [marketPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("market"), Buffer.from(marketId)],
                program.programId
            );

            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), Buffer.from(marketId)],
                program.programId
            );

            // Default oracle (system program as placeholder if no actual feed)
            const oracleFeed = SystemProgram.programId;

            console.log("useBetting: Initializing market", {
                marketId,
                marketPda: marketPda.toBase58(),
                endTime: new BN(endTime)
            });

            const tx = await program.methods
                .initializeMarket(
                    marketId,
                    oracleFeed,
                    DEV_WALLET,
                    new BN(endTime)
                )
                .accounts({
                    market: marketPda,
                    vault: vaultPda,
                    authority: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("Market initialized! TX:", tx);
            return tx;
        } catch (error) {
            console.error("Error initializing market:", error);
            throw error;
        } finally {
            setIsTxPending(false);
        }
    };

    return { placeBet, claimWinnings, initializeMarket, isTxPending };
};

export const useUserBets = () => {
    const { program } = useSportsProgram();
    const { publicKey } = useWallet();
    const [bets, setBets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBets = useCallback(async () => {
        if (!program || !publicKey) {
            setIsLoading(false);
            return;
        }

        try {
            console.log("useUserBets: Fetching user positions...");
            // Fetch all UserBet accounts for this owner
            const userBetAccounts = await (program.account as any).userBet.all([
                {
                    memcmp: {
                        offset: 40,
                        bytes: publicKey.toBase58(),
                    },
                },
            ]);

            if (userBetAccounts.length === 0) {
                setBets([]);
                return;
            }

            // Batch fetch all unique market accounts to save RPC calls
            const marketPubkeys = Array.from(new Set(userBetAccounts.map((a: any) => a.account.market.toBase58())))
                .map(pk => new PublicKey(pk as string));

            const marketAccounts = await (program.account as any).market.fetchMultiple(marketPubkeys);

            // Map markets by their address for quick lookup
            const marketMap = new Map();
            marketPubkeys.forEach((pk, i) => {
                if (marketAccounts[i]) {
                    marketMap.set(pk.toBase58(), marketAccounts[i]);
                }
            });

            const betsWithMarkets = userBetAccounts.map((account: any) => ({
                publicKey: account.publicKey,
                ...account.account,
                marketData: marketMap.get(account.account.market.toBase58())
            }));

            setBets(betsWithMarkets);
        } catch (error) {
            console.error("Error fetching user bets:", error);
        } finally {
            setIsLoading(false);
        }
    }, [program, publicKey]);

    return { bets, isLoading, fetchBets };
};
