"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../idl/sports_prediction.json";

const PROGRAM_ID = new PublicKey("GvC6eD5B6z9M1vRzT1p7fQyYvA5xP7Z1aB2c3D4e5F6g"); // Placeholder, should be the deployed ID

export const useSportsProgram = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const program = useMemo(() => {
        if (!wallet) return null;

        const provider = new AnchorProvider(connection, wallet, {
            preflightCommitment: "processed",
        });

        return new Program(idl as Idl, PROGRAM_ID, provider);
    }, [connection, wallet]);

    return { program };
};
