"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "../idl/sports_prediction.json";

export const useSportsProgram = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const program = useMemo(() => {
        if (!wallet) return null;

        const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());

        try {
            // Anchor 0.30+ IDL initialization
            const programId = idl.address;
            if (!programId) {
                console.warn("No address found in IDL metadata");
            }
            return new Program(idl as any, provider);
        } catch (e) {
            console.error("Failed to initialize Program:", e);
            return null;
        }
    }, [connection, wallet]);

    return { program };
};
