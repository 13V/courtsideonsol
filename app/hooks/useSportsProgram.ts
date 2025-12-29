"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/sports_prediction.json";

const PROGRAM_ID = "5oCaNW77tTwpAdZqhyebZ73zwm1DtfR3Ye7Cy9VWyqtT";

export const useSportsProgram = () => {
    const { connection } = useConnection();
    const { publicKey, signTransaction, signAllTransactions } = useWallet();

    const program = useMemo(() => {
        if (!connection || !idl) return null;

        try {
            // Use real wallet if available, otherwise fallback to a read-only dummy
            const wallet = (publicKey && signTransaction && signAllTransactions)
                ? { publicKey, signTransaction, signAllTransactions }
                : {
                    publicKey: new PublicKey("11111111111111111111111111111111"),
                    signTransaction: async (t: unknown) => t,
                    signAllTransactions: async (t: unknown) => t
                };

            const provider = new AnchorProvider(
                connection,
                wallet as unknown as {
                    publicKey: PublicKey;
                    signTransaction: (tx: never) => Promise<never>;
                    signAllTransactions: (txs: never[]) => Promise<never>;
                },
                { preflightCommitment: "processed" }
            );

            return new Program(idl as never, provider);
        } catch (e) {
            console.error("useSportsProgram: Initialization failed", e);
            return null;
        }
    }, [connection, publicKey, signTransaction, signAllTransactions]);

    return { program };
};
