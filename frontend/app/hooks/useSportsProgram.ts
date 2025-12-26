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
        if (!wallet || !wallet.publicKey) {
            return null;
        }

        try {
            const provider = new AnchorProvider(connection, wallet, {
                preflightCommitment: "processed",
            });

            // Log IDL details for debugging
            const cleanIdl = JSON.parse(JSON.stringify(idl));
            console.log("useSportsProgram: Initializing with IDL address", cleanIdl.address);
            console.log("useSportsProgram: IDL check - Accounts:", cleanIdl.accounts?.map((a: any) => a.name));
            console.log("useSportsProgram: IDL check - Instructions:", cleanIdl.instructions?.map((i: any) => i.name));

            // In Anchor 0.30+, Program constructor takes (idl, provider)
            // The address is pulled from idl.address
            return new Program(cleanIdl, provider);
        } catch (e: any) {
            console.error("useSportsProgram ERROR:", e.message);
            console.error("Stack:", e.stack);
            return null;
        }
    }, [connection, wallet]);

    return { program };
};
