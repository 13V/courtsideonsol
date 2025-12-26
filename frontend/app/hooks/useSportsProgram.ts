"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/sports_prediction.json";

export const useSportsProgram = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const program = useMemo(() => {
        console.log("useSportsProgram: Checking wallet...", wallet?.publicKey?.toString());

        if (!wallet || !wallet.publicKey) {
            console.log("useSportsProgram: No wallet or publicKey found.");
            return null;
        }

        try {
            const provider = new AnchorProvider(connection, wallet, {
                preflightCommitment: "processed",
            });

            console.log("useSportsProgram: Initializing Program with provider...");

            // Convert IDL to a plain JS object
            const rawIdl = JSON.parse(JSON.stringify(idl));
            const p = new Program(rawIdl, provider);

            console.log("useSportsProgram: Program initialized successfully!");
            return p;
        } catch (e: any) {
            console.error("useSportsProgram: CRITICAL FAILURE during Program initialization!");
            console.error("Error message:", e.message);
            console.error("Error stack:", e.stack);
            return null;
        }
    }, [connection, wallet]);

    return { program };
};
