"use client";

import React, { useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles
import "@solana/wallet-adapter-react-ui/styles.css";
import { Buffer } from "buffer";

if (typeof window !== "undefined" && !window.Buffer) {
    (window as any).Buffer = Buffer;
}

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
    // Use private QuickNode RPC if available via env, fallback to hardcoded QuickNode as default to resolve 403
    const endpoint = useMemo(() =>
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://mainnet.helius-rpc.com/?api-key=026544e2-2acd-499a-84f1-51d00ecbb3f9",
        []);

    // Empty wallets array - users can install Phantom/Solflare extensions
    const wallets = useMemo(() => [], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
