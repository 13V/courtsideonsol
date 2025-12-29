"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Play,
  X,
  Zap,
  History,
  Trophy,
  Shield,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBetting, useUserBets } from './hooks/useBetting';
import { useSportsProgram } from './hooks/useSportsProgram';
import { useLiveScores, LiveScore } from './hooks/useLiveScores';

import { PublicKey } from '@solana/web3.js';

// --- TYPES ---
const TEAM_NAMES: Record<string, string> = {
  "PHI": "76ers",
  "OKC": "Thunder",
  "MIL": "Bucks",
  "LAL": "Lakers",
  "GSW": "Warriors",
  "BOS": "Celtics",
  "PHX": "Suns",
  "DEN": "Nuggets",
  "LAC": "Clippers",
  "MIA": "Heat",
  "NYK": "Knicks",
  "DAL": "Mavericks",
  "MIN": "Timberwolves",
  "SAC": "Kings",
  "NOP": "Pelicans",
  "HOU": "Rockets",
  "CHI": "Bulls",
  "CLE": "Cavaliers",
  "ATL": "Hawks",
  "ORL": "Magic",
  "IND": "Pacers",
  "BKN": "Nets",
  "TOR": "Raptors",
  "MEM": "Grizzlies",
  "DET": "Pistons",
  "CHA": "Hornets",
  "SAS": "Spurs",
  "UTA": "Jazz",
  "WAS": "Wizards",
  "POR": "Blazers"
};

type Market = {
  id: string;
  slug: string;
  marketType: string;
  fullName: string;
  homeShort: string;
  awayShort: string;
  homeColor?: string;
  awayColor?: string;
  homeLogo?: string;
  awayLogo?: string;
  probA: number;
  probB: number;
  volume: number;
  totalPool: number;
  isLive: boolean;
  image: string;
  history: number[];
  sportLabel: string;
  startDate?: string;
  homeAbbr?: string;
  awayAbbr?: string;
};

// --- DATA FETCHING ---
const useMarkets = (pollingInterval = 300000) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await fetch('/api/markets', { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          setMarkets(data);
        }
      } catch (error) {
        console.error("Failed to fetch markets", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval]);

  return { markets, isLoading };
};

// --- COMPONENT: TEAM BADGE (ULTRA FIDELITY) ---
const TeamBadge = ({ name, color, logo, size = "md" }: { name: string; color: string; logo?: string; size?: "sm" | "md" }) => {
  const s = size === "sm" ? "w-11 h-11" : "w-16 h-16";
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`${s} relative rounded-2xl border-2 flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl shrink-0 overflow-hidden transition-all duration-500`}
      style={{
        borderColor: `${color}44`,
        boxShadow: `0 0 20px ${color}22`
      }}
    >
      {logo && !imgError ? (
        <img
          src={logo}
          alt={name}
          className="w-[85%] h-[85%] object-contain relative z-10 [image-rendering:high-quality] transform translate-z-0"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-[9px] font-black italic tracking-tighter relative z-10" style={{ color }}>
          {name.slice(0, 3)}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </div>
  );
};

// --- COMPONENT: KAYO MARKET CARD (REFINED BROADCAST) ---
const KayoMarketCard = ({
  market,
  onClick,
  onBet,
  isTxPending,
  liveScore
}: {
  market: Market;
  onClick: (m: Market) => void;
  onBet: (outcome: number, e: React.MouseEvent) => void;
  isTxPending: boolean;
  liveScore?: LiveScore;
}) => {
  const [isLive, setIsLive] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateStatus = () => {
      const start = market.startDate ? new Date(market.startDate).getTime() : 0;
      if (start === 0) {
        setIsLive(true);
        setTimeLeft("LIVE");
        return;
      }
      const now = Date.now();
      setIsLive(now >= start);

      if (now < start) {
        const diff = start - now;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft("LIVE");
      }
    };
    updateStatus();
    const timer = setInterval(updateStatus, 1000);
    return () => clearInterval(timer);
  }, [market.startDate]);

  const handleBet = (outcomeId: number, e: React.MouseEvent) => {
    onBet(outcomeId, e);
  };

  const probA = market.probA || 50;
  const probB = 100 - probA;

  // Calculate Potential Return
  const getReturn = (prob: number) => {
    if (!prob || prob === 0) return "1.80";
    // Formula: (1 / (prob/100)) * (1 - devFee)
    const multiplier = (100 / prob) * 0.9;
    return multiplier.toFixed(2);
  };

  return (
    <div className="group cursor-pointer flex flex-col gap-4 neon-pulse-brand">

      {/* CINEMATIC BROADCAST AREA (16:9) */}
      <div
        onClick={() => onClick(market)}
        className="relative aspect-video rounded-[36px] overflow-hidden bg-[#050505] border border-white/5 group-hover:border-[#00FF00]/40 transition-all duration-700 shadow-2xl"
      >
        <img
          src={market.image}
          alt={market.sportLabel}
          className="w-full h-full object-cover opacity-30 group-hover:scale-105 group-hover:opacity-50 transition-all duration-1000 ease-out grayscale-[20%] group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

        {/* LIVE INDICATOR */}
        {isLive && (
          <div className="absolute top-0 left-0 z-20">
            <div className="bg-[#00FF00] text-black px-5 py-2.5 rounded-br-[20px] flex items-center gap-2 transform -skew-x-12 -ml-2 shadow-[0_5px_15px_rgba(0,255,0,0.3)]">
              <span className="text-[10px] font-black italic tracking-[0.2em] uppercase skew-x-12 ml-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                LIVE
              </span>
            </div>
          </div>
        )}

        {/* LEAGUE LABEL */}
        <div className="absolute top-5 left-20 text-[9px] font-black italic tracking-[0.3em] text-white/20 uppercase">
          {market.sportLabel}
        </div>

        {/* Live Score Overlay */}
        {liveScore && liveScore.status !== 'PRE' && (
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-1">
            <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full animate-pulse">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              <span className="text-[9px] font-black italic tracking-widest text-white uppercase">LIVE</span>
            </div>
            <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
              <span className="text-xs font-black italic text-[#00FF00]">{liveScore.awayScore}</span>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-xs font-black italic text-white">{liveScore.homeScore}</span>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-[9px] font-bold text-white/60 tracking-tighter uppercase whitespace-nowrap">{liveScore.clock || liveScore.displayStatus}</span>
            </div>
          </div>
        )}


        {/* CENTER MATCHUP (RADICALLY SCALED FOR FULL VISIBILITY) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6">
          <div className="flex flex-col items-center w-full transform group-hover:scale-105 transition-transform duration-500">
            <h3 className="text-[22px] lg:text-[27px] font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] text-center px-2">
              {market.homeShort}
            </h3>
            <div className="flex items-center gap-4 my-2">
              <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[#00FF00]/40" />
              <span className="text-base font-black italic text-[#00FF00] drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">VS</span>
              <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[#00FF00]/40" />
            </div>
            <h3 className="text-[22px] lg:text-[27px] font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] text-center px-2">
              {market.awayShort}
            </h3>
          </div>
        </div>

        {/* PLAY BUTTON */}
        <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-black/60 backdrop-blur-2xl flex items-center justify-center border border-white/10 text-white group-hover:bg-[#00FF00] group-hover:text-black transition-all duration-500 shadow-2xl">
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </div>
      </div>

      {/* SIMPLIFIED ACTION HUD */}
      <div className="space-y-4 px-1">
        <div className="flex items-center justify-between text-[9px] font-black italic tracking-[0.2em] text-white/10 uppercase">
          <span className="flex items-center gap-2 group-hover:text-[#00FF00] transition-colors">
            <Zap className="w-3 h-3 text-[#00FF00]" />
            PROTOCOL DATA
          </span>
          <div className="flex items-center gap-4">
            {!isLive && timeLeft && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                <Activity className="w-2.5 h-2.5 text-[#00FF00] animate-pulse" />
                <span className="font-mono text-[#00FF00] text-[8px] tracking-widest">{timeLeft}</span>
              </div>
            )}
            <span className="font-mono text-white/5">${(market.volume).toLocaleString()} VOL</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* HOME SIDE */}
          <div
            onClick={(e) => handleBet(0, e)}
            className={`relative p-3 bg-[#080808] rounded-[24px] border border-white/5 transition-all flex items-center justify-between overflow-hidden group/btn cursor-pointer ${isTxPending ? 'opacity-50 pointer-events-none' : 'hover:border-[#00FF00]/40'}`}
            style={{ borderLeftWidth: '4px', borderLeftColor: market.homeColor || '#00FF00' }}
          >
            <TeamBadge name={market.homeShort} color={market.homeColor || '#00FF00'} logo={market.homeLogo} size="sm" />
            <div
              onClick={(e) => {
                e.stopPropagation();
                onBet(0, e);
              }}
              className="flex flex-col items-end gap-1.5 z-10 px-1 hover:scale-110 transition-transform active:scale-95"
            >
              <div className="text-2xl font-black italic leading-none tracking-tighter">{probA}%</div>
              <div className="text-[10px] font-bold text-[#00FF00]/60 group-hover/btn:text-[#00FF00] uppercase tracking-widest transition-colors">
                {getReturn(probA)}x Return
              </div>
            </div>

            {/* Brand Glow */}
            <div
              className="absolute inset-y-0 left-0 w-12 blur-[25px] opacity-0 group-hover/btn:opacity-20 transition-opacity"
              style={{ backgroundColor: market.homeColor }}
            />
          </div>

          {/* AWAY SIDE */}
          <div
            onClick={(e) => handleBet(1, e)}
            className={`relative p-3 bg-[#080808] rounded-[24px] border border-white/5 transition-all flex items-center justify-between overflow-hidden group/btn cursor-pointer ${isTxPending ? 'opacity-50 pointer-events-none' : 'hover:border-pink-500/40'}`}
            style={{ borderRightWidth: '4px', borderRightColor: market.awayColor || '#00FF00' }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onBet(1, e);
              }}
              className="flex flex-col items-start gap-2 z-10 px-1 hover:scale-110 transition-transform active:scale-95"
            >
              <div className="text-2xl font-black italic leading-none tracking-tighter">{probB}%</div>
              <div className="text-[10px] font-bold text-pink-500/60 group-hover/btn:text-pink-500 uppercase tracking-widest transition-colors">
                {getReturn(probB)}x Return
              </div>
            </div>
            <TeamBadge name={market.awayShort} color={market.awayColor || '#00FF00'} logo={market.awayLogo} size="sm" />

            {/* Brand Glow */}
            <div
              className="absolute inset-y-0 right-0 w-12 blur-[25px] opacity-0 group-hover/btn:opacity-20 transition-opacity"
              style={{ backgroundColor: market.awayColor }}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default function Home() {
  const { markets, isLoading } = useMarkets();
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [mounted, setMounted] = useState(false);
  const [onChainMarkets, setOnChainMarkets] = useState<Map<string, any>>(new Map());
  const [allProgramMarkets, setAllProgramMarkets] = useState<any[]>([]);
  const { placeBet, claimWinnings, initializeMarket, isTxPending } = useBetting();
  const { bets, isLoading: isBetsLoading, fetchBets } = useUserBets();
  const { publicKey, connected } = useWallet();
  const { program } = useSportsProgram();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { getScoreForMarket } = useLiveScores();
  const [claimTxs, setClaimTxs] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch user bets when wallet connects or changes
  useEffect(() => {
    if (connected && publicKey) {
      fetchBets();
    }
  }, [publicKey, connected, fetchBets]);

  // Persistent Claim Transactions
  useEffect(() => {
    const saved = localStorage.getItem('courtside_claims');
    if (saved) {
      try {
        setClaimTxs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load claims from local storage", e);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(claimTxs).length > 0) {
      localStorage.setItem('courtside_claims', JSON.stringify(claimTxs));
    }
  }, [claimTxs]);

  const fetchOnChain = useCallback(async () => {
    if (!program || markets.length === 0) return;
    try {
      console.log("Home: Fetching on-chain market data via batch...");

      // Derive PDAs for all known markets, including potential V2/V3 versions for ghost settlements
      const pdaRequests: { id: string; pda: PublicKey }[] = [];

      const encoder = new TextEncoder();
      markets.forEach(m => {
        // Base version
        const [pda] = PublicKey.findProgramAddressSync(
          [encoder.encode("market"), encoder.encode(m.id)],
          program.programId
        );
        pdaRequests.push({ id: m.id, pda });

        // Potential V2/V3 versions
        [2, 3].forEach(v => {
          const [vpda] = PublicKey.findProgramAddressSync(
            [encoder.encode("market"), encoder.encode(`${m.id}-v${v}`)],
            program.programId
          );
          pdaRequests.push({ id: `${m.id}-v${v}`, pda: vpda });
        });
      });

      console.log(`Home: requesting PDAs for ${markets.length} markets.`, pdaRequests.map(r => r.id));

      const marketAccounts = await (program.account as any).market.fetchMultiple(pdaRequests.map(r => r.pda));
      console.log(`Home: received ${marketAccounts.filter((a: any) => a !== null).length} active on-chain accounts.`);

      const marketMap = new Map();
      pdaRequests.forEach((req, i) => {
        if (marketAccounts[i]) {
          marketMap.set(req.id, marketAccounts[i]);
        }
      });

      setOnChainMarkets(marketMap);

      // DEBUG: Fetch every single market account from the program to see what's out there
      const allAccounts = await (program.account as any).market.all();
      setAllProgramMarkets(allAccounts.map((a: any) => ({
        pubkey: a.publicKey.toBase58(),
        eventId: a.account.eventId,
        status: a.account.status
      })));

      console.log(`Home: Global Arena check found ${allAccounts.length} total markets on program.`);
    } catch (err) {
      console.error("Home: Failed to fetch on-chain markets", err);
    }
  }, [program, markets]);

  // Sync on-chain markets with throttling
  useEffect(() => {
    fetchOnChain();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOnChain();
      } else {
        console.log("Home: Tab hidden, skipping RPC poll.");
      }
    }, 120000); // 2 minute polling
    return () => clearInterval(interval);
  }, [fetchOnChain]);

  const [betAmount, setBetAmount] = useState<string>("0.001");
  const [betOutcome, setBetOutcome] = useState<number | null>(null);

  const handleBetClick = async (market: Market, outcomeId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    console.log("Home: handleBetClick triggered", { marketId: market.id, outcomeId });

    // Set for modal
    setSelectedMarket(market);
    setBetOutcome(outcomeId);
  };

  // Smart On-Chain Lookup (Handles V2/V3 versions)
  const getActiveMarketStatus = (marketId: string) => {
    const v3 = onChainMarkets.get(`${marketId}-v3`);
    if (v3) return { status: v3.status, id: `${marketId}-v3` };
    const v2 = onChainMarkets.get(`${marketId}-v2`);
    if (v2) return { status: v2.status, id: `${marketId}-v2` };
    const base = onChainMarkets.get(marketId);
    if (base) return { status: base.status, id: marketId };
    return null;
  };

  const handleBetExecution = async (marketId: string, outcomeId: number) => {
    console.log("Home: handleBetExecution triggered", { marketId, outcomeId, amount: betAmount });
    try {
      // Use the potentially versioned ID for betting
      const activeInfo = getActiveMarketStatus(marketId);
      if (!activeInfo) {
        alert("This market is not initialized on Solana yet!");
        return;
      }

      const ocMarket = onChainMarkets.get(activeInfo.id);
      if (!ocMarket) return;

      // Check if market is Open
      const status = ocMarket.status;
      if (!status || !status.open) {
        alert("This market is no longer open for betting.");
        return;
      }

      const amount = parseFloat(betAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid SOL amount.");
        return;
      }

      const tx = await placeBet(activeInfo.id, outcomeId, amount);
      if (tx) {
        setBetAmount("0.001");
        setBetOutcome(null);
        setSelectedMarket(null);
        // Refresh bets after placement
        setTimeout(fetchBets, 2000);
      }
    } catch (error) {
      console.error("Home: handleBet error", error);
    }
  };

  const handleInitialize = async (market: Market) => {
    console.log("Home: handleInitialize triggered", market.id);
    try {
      // Check if we need to version-up due to ghost settlement
      const current = getActiveMarketStatus(market.id);
      let targetId = market.id;
      if (current && current.status?.settled) {
        // Find next version
        if (current.id.endsWith("-v2")) targetId = `${market.id}-v3`;
        else targetId = `${market.id}-v2`;
        console.log("Re-initializing Ghost Settled market as:", targetId);
      }

      // Default end time to 24 hours from now if missing
      const endTime = market.startDate ? new Date(market.startDate).getTime() / 1000 : (Date.now() / 1000) + 86400;
      await initializeMarket(targetId, Math.floor(endTime));

      // Update local state immediately with a placeholder status
      setOnChainMarkets(prev => {
        const next = new Map(prev);
        next.set(targetId, { status: { open: {} }, eventId: targetId });
        return next;
      });
      alert("Market initialized successfully!");
    } catch (err) {
      console.error("Home: handleInitialize error", err);
      alert("Failed to initialize market. Check console for details.");
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#00FF00] selection:text-black overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-[#00FF00] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all">
              <Zap className="w-6 h-6 text-black fill-current" />
            </div>
            <span className="font-black text-2xl tracking-tighter italic">COURTSIDE</span>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-[10px] font-black italic tracking-widest uppercase text-white/40">
              <a href="#" className="hover:text-[#00FF00] transition-colors">Markets</a>
              <a href="#" className="hover:text-[#00FF00] transition-colors">Live Feed</a>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="hover:text-[#00FF00] transition-colors flex items-center gap-2"
              >
                MY PREDICTIONS
                {bets.some((b: any) => b.marketData?.status?.settled && b.outcomeId === b.marketData.winningOutcome && !b.claimed) && (
                  <span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full animate-bounce" />
                )}
              </button>
            </div>
            {mounted && (
              <WalletMultiButton className="!bg-[#00FF00] !text-black !rounded-2xl !font-black !text-xs !px-8 hover:!scale-105 transition-transform !uppercase !tracking-widest !shadow-[0_0_20px_rgba(0,255,0,0.2)]" />
            )}
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 max-w-[1600px] mx-auto px-10">

        {/* HERO SECTION */}
        <section className="mb-24 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse" />
              <span className="text-[10px] font-black italic text-[#00FF00] tracking-[0.3em] uppercase">Status: Protocol Operational</span>
            </div>
            <h1 className="text-7xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.8] drop-shadow-2xl">
              <span className="text-white/20">THE NEXT</span> <br />
              <span className="text-white">LEVEL OF</span> <br />
              <span className="text-[#00FF00]">ACTION.</span>
            </h1>
            <p className="text-xl text-white/40 max-w-xl leading-relaxed font-medium">
              Trade on the pulse of live sports. High-fidelity markets, instant settle, and decentralized liquidity on the frontier of Solana.
            </p>
          </div>

          <div className="grid gap-6">
            {[
              { step: "01", title: "Verify Access", desc: "Connect your Solana wallet to enter the arena." },
              { step: "02", title: "Select Tier", desc: "Browse high-volume broadcast tiers and market lines." },
              { step: "03", title: "Trade Live", desc: "Positions settle to your wallet the moment the clock stops." }
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-6 p-8 border border-white/5 rounded-[40px] bg-white/[0.02] hover:bg-white/[0.05] transition-all group border-l-4 border-l-transparent hover:border-l-[#00FF00]">
                <span className="text-5xl font-black italic text-white/[0.03] group-hover:text-[#00FF00]/10 transition-colors">{s.step}</span>
                <div className="pt-1">
                  <h3 className="font-black italic text-2xl uppercase text-white mb-2 group-hover:translate-x-1 transition-transform">{s.title}</h3>
                  <p className="text-white/30 font-medium leading-relaxed max-w-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BOARDCAST HEADER */}
        <div className="flex items-end justify-between mb-16 border-b border-white/5 pb-8">
          <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
            BROADCASTING <br /> <span className="text-[#00FF00]">NOW</span>
          </h2>

          <div className="flex gap-4 items-center">
            <button
              onClick={() => fetchOnChain()}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition border border-white/10"
              title="Refresh Markets"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button className="px-8 py-3.5 rounded-2xl bg-[#00FF00] text-black text-[10px] font-black italic uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,255,0,0.2)]">
              Top Volume
            </button>
            <button className="px-8 py-3.5 rounded-2xl border border-white/10 text-white/40 text-[10px] font-black italic uppercase tracking-widest hover:text-white transition-colors">
              Recent
            </button>
          </div>
        </div>

        {/* --- FEED GRID --- */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="flex flex-col gap-4">
                <div className="aspect-video bg-white/[0.02] rounded-[32px] animate-pulse" />
                <div className="h-20 bg-white/[0.02] rounded-[32px] animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="space-y-32">

            {/* 1. READY TO BET SECTION (On-Chain & Open or Ghost Settled) */}
            {markets.filter(m => {
              const active = getActiveMarketStatus(m.id);
              if (!active) return false;
              if (active.status?.open) return true;

              // Move Ghost Settled back to Ready pool (but they'll need re-init if really closed)
              // Actually, if it's settled, we want it in 'Upcoming' to re-init.
              // So 'Ready to Bet' should ONLY show open markets.
              return false;
            }).length > 0 && (
                <section className="space-y-12">
                  <div className="flex items-center gap-6">
                    <div className="w-1.5 h-12 bg-[#00FF00] rounded-full" />
                    <h3 className="text-4xl font-black italic tracking-tighter uppercase">Ready to Bet</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
                    {markets
                      .filter(m => {
                        const active = getActiveMarketStatus(m.id);
                        return active && active.status?.open;
                      })
                      .map((market) => (
                        <KayoMarketCard
                          key={market.id}
                          market={market}
                          onClick={() => setSelectedMarket(market)}
                          onBet={(outcome, e) => handleBetClick(market, outcome, e)}
                          isTxPending={isTxPending}
                          liveScore={getScoreForMarket(market.homeShort, market.awayShort)}
                        />
                      ))}
                  </div>
                </section>
              )}

            {/* 2. AVAILABLE FOR INITIALIZATION (Not On-Chain or Ghost Settled) */}
            <section className="space-y-12">
              <div className="flex items-center gap-6">
                <div className="w-1.5 h-12 bg-white/10 rounded-full" />
                <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white/40">Upcoming Markets</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
                {markets
                  .filter(m => {
                    const active = getActiveMarketStatus(m.id);
                    if (!active) return true; // Not on-chain at all

                    // If it is on-chain but settled and in the future, it's a ghost.
                    // We allow "Re-initializing" it.
                    const startDate = m.startDate ? new Date(m.startDate).getTime() : 0;
                    const isGhost = active.status?.settled && startDate > Date.now() + (3 * 60 * 60 * 1000);
                    return isGhost;
                  })
                  .map((market) => {
                    const active = getActiveMarketStatus(market.id);
                    const isGhost = active && active.status?.settled;

                    return (
                      <div key={market.id} className="relative group">
                        <div className="opacity-40 grayscale pointer-events-none transition-all group-hover:blur-[2px]">
                          <KayoMarketCard
                            market={market}
                            onClick={() => { }}
                            onBet={() => { }}
                            isTxPending={false}
                          />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-[36px] opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <button
                            onClick={() => handleInitialize(market)}
                            disabled={isTxPending}
                            className={`px-10 py-5 ${isGhost ? 'bg-[#00FF00]' : 'bg-white'} text-black font-black italic uppercase tracking-widest text-xs rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]`}
                          >
                            {isTxPending ? 'PROCESSING...' : isGhost ? 'Reset & Deploy V2' : 'Initialize On-Chain'}
                          </button>
                          <p className="mt-4 text-[9px] font-black italic tracking-[0.2em] text-white/60 uppercase">
                            {isGhost ? 'Ghost Settlement Detected' : 'Deploy to Solana'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {markets.filter(m => !getActiveMarketStatus(m.id)).length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-white/10 border-4 border-white/[0.02] border-dashed rounded-[60px] bg-white/[0.01]">
                  <Activity className="w-16 h-16 mb-6 opacity-5" />
                  <p className="font-black italic text-xl uppercase tracking-widest text-center px-6">All Signal Active: No Upcoming Broadcasts</p>
                </div>
              )}
            </section>


            {/* 3. RESOLVED SECTION (On-Chain & Settled) */}
            {markets.filter(m => {
              const active = getActiveMarketStatus(m.id);
              if (!active || !active.status?.settled) return false;
              const startDate = m.startDate ? new Date(m.startDate).getTime() : 0;
              const isGhost = startDate > Date.now() + (3 * 60 * 60 * 1000);
              return !isGhost;
            }).length > 0 && (
                <section className="space-y-12">
                  <div className="flex items-center gap-6">
                    <div className="w-1.5 h-12 bg-pink-500 rounded-full" />
                    <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white/30">Resolved Markets</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
                    {markets
                      .filter(m => {
                        const active = getActiveMarketStatus(m.id);
                        if (!active || !active.status?.settled) return false;
                        const startDate = m.startDate ? new Date(m.startDate).getTime() : 0;
                        const isGhost = startDate > Date.now() + (3 * 60 * 60 * 1000);
                        return !isGhost;
                      })
                      .map((market) => (
                        <div key={market.id} className="relative opacity-60 grayscale scale-95 transition-all hover:opacity-80">
                          <KayoMarketCard
                            market={market}
                            onClick={() => setSelectedMarket(market)}
                            onBet={() => { }}
                            isTxPending={false}
                            liveScore={getScoreForMarket(market.homeShort, market.awayShort)}
                          />
                          <div className="absolute top-4 right-4 bg-pink-500 text-black px-4 py-1.5 rounded-full text-[9px] font-black italic tracking-widest uppercase shadow-lg z-20">
                            SETTLED
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              )}
          </div>
        )}

        {/* --- DEBUG DIAGNOSTICS (HIDDEN IN PRODUCTION OR REVEALED FOR DEV) --- */}
        <div className="mt-40 p-10 border-t border-white/5 bg-white/[0.01] rounded-[60px]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Arena Debug Diagnostics</h3>
              <p className="text-white/20 text-xs">Direct Protocol State Visibility (Mainnet-Beta)</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-[10px] font-bold ${program ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'bg-red-500/10 text-red-500'}`}>
              {program ? 'RPC LINKED' : 'RPC DISCONNECTED'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black italic tracking-widest text-white/40 uppercase">Display Filters</h4>
              <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Total Polymarket API Markets:</span>
                  <span className="font-mono text-white">{markets.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Markets Linked to Solana:</span>
                  <span className="font-mono text-[#00FF00]">{onChainMarkets.size}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Program ID:</span>
                  <span className="font-mono text-white/60 text-[10px] truncate ml-4">5oCaNW77...WyqtT</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black italic tracking-widest text-white/40 uppercase">Global Program State</h4>
              <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-2 max-h-[200px] overflow-y-auto">
                {allProgramMarkets.length === 0 ? (
                  <p className="text-xs text-white/20 italic">No markets found on program address.</p>
                ) : (
                  allProgramMarkets.map((m, i) => (
                    <div key={i} className="flex flex-col gap-1 py-2 border-b border-white/5 last:border-0">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-white/60 font-mono">{m.eventId}</span>
                        <span className="text-[#00FF00] uppercase">{Object.keys(m.status)[0]}</span>
                      </div>
                      <span className="text-[8px] text-white/20 font-mono truncate">{m.pubkey}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BETTING MODAL */}
      <AnimatePresence>
        {selectedMarket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
            onClick={() => setSelectedMarket(null)}
          >
            <div
              className="w-full max-w-2xl bg-[#0A0A0A] rounded-[60px] border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[2.5/1]">
                <img
                  src={selectedMarket.image}
                  alt={selectedMarket.fullName}
                  className="w-full h-full object-cover opacity-40 shadow-inner"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                <button onClick={() => setSelectedMarket(null)} className="absolute top-8 right-8 p-4 bg-black/50 hover:bg-white/10 rounded-full transition border border-white/10">
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <h2 className="text-2xl lg:text-3xl font-black italic uppercase leading-none tracking-tighter mb-2 drop-shadow-2xl">
                    {selectedMarket.fullName}
                  </h2>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const score = getScoreForMarket(selectedMarket.homeShort, selectedMarket.awayShort);
                      if (!score || score.status === 'PRE') return (
                        <div className="px-4 py-1.5 bg-[#00FF00] text-black text-[9px] font-black italic tracking-widest uppercase rounded-full">
                          Head to Head
                        </div>
                      );
                      return (
                        <div className="flex items-center gap-4 px-6 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                          <div className="text-2xl font-black italic text-[#00FF00]">{score.awayScore}</div>
                          <div className="flex flex-col items-center">
                            <div className="text-[10px] font-black italic text-white/40 uppercase leading-none mb-1">LIVE</div>
                            <div className="text-[8px] font-bold text-white uppercase tracking-widest">{score.clock || score.displayStatus}</div>
                          </div>
                          <div className="text-2xl font-black italic text-white">{score.homeScore}</div>
                        </div>
                      );
                    })()}
                    <div className="text-white/40 font-mono text-[10px]">
                      ID: {selectedMarket.id.slice(-8)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBetOutcome(0)}
                    disabled={isTxPending}
                    className={`p-3 bg-white/[0.03] border-2 rounded-[24px] hover:border-[#00FF00]/40 transition-all group flex flex-col items-center gap-2 ${betOutcome === 0 ? 'border-[#00FF00] bg-[#00FF00]/5' : 'border-white/5'} ${isTxPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <TeamBadge name={selectedMarket.homeShort} color={selectedMarket.homeColor || "#00FF00"} logo={selectedMarket.homeLogo} size="sm" />
                    <div className="text-center">
                      <div className="text-[8px] font-black italic tracking-widest text-[#00FF00] uppercase mb-0.5">TEAM A</div>
                      <div className="text-2xl font-black italic">{selectedMarket.probA}%</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setBetOutcome(1)}
                    disabled={isTxPending}
                    className={`p-3 bg-white/[0.03] border-2 rounded-[24px] hover:border-[#FF0033]/40 transition-all group flex flex-col items-center gap-2 ${betOutcome === 1 ? 'border-[#FF0033] bg-[#FF0033]/5' : 'border-white/5'} ${isTxPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <TeamBadge name={selectedMarket.awayShort} color={selectedMarket.awayColor || "#FF0033"} logo={selectedMarket.awayLogo} size="sm" />
                    <div className="text-center">
                      <div className="text-[8px] font-black italic tracking-widest text-[#FF0033] uppercase mb-0.5">TEAM B</div>
                      <div className="text-2xl font-black italic">{selectedMarket.probB}%</div>
                    </div>
                  </button>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black italic tracking-widest text-white/40 uppercase">
                    <span>Position Size</span>
                    <div className="flex gap-2">
                      {["0.05", "0.1", "0.5", "1"].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setBetAmount(amt)}
                          className={`px-3 py-1 rounded-full border border-white/10 text-[9px] hover:bg-white/10 transition-all font-black italic ${betAmount === amt ? 'bg-[#00FF00] text-black border-[#00FF00]' : ''}`}
                        >
                          {amt} SOL
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/[0.03] border-2 border-white/10 rounded-[24px] p-5 text-3xl font-black italic focus:outline-none focus:border-[#00FF00]/50 transition-all text-center placeholder:text-white/10"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-black italic text-[#00FF00]">SOL</div>
                  </div>
                </div>

                {/* Return Estimate */}
                {betOutcome !== null && !isNaN(parseFloat(betAmount)) && parseFloat(betAmount) > 0 && (
                  <div className="p-5 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-[24px] flex justify-between items-center">
                    <div>
                      <div className="text-[9px] font-black italic tracking-widest text-[#00FF00]/60 uppercase mb-0.5">Potential Payout</div>
                      <div className="text-2xl font-black italic text-[#00FF00]">
                        {(parseFloat(betAmount) * (100 / (betOutcome === 0 ? selectedMarket.probA : selectedMarket.probB))).toFixed(2)} SOL
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black italic tracking-widest text-white/40 uppercase mb-0.5">ROI</div>
                      <div className="text-lg font-bold text-white">
                        {((100 / (betOutcome === 0 ? selectedMarket.probA : selectedMarket.probB) - 1) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => betOutcome !== null && handleBetExecution(selectedMarket.id, betOutcome)}
                  disabled={isTxPending || betOutcome === null || !betAmount || parseFloat(betAmount) <= 0}
                  className={`w-full py-4 bg-[#00FF00] text-black font-black text-xl uppercase italic tracking-widest rounded-[24px] hover:scale-[1.01] active:scale-95 transition-all shadow-[0_15px_30px_rgba(0,255,0,0.1)] ${isTxPending || betOutcome === null ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                >
                  {isTxPending ? 'EXECUTING...' : 'Execute Position'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEBUG OVERLAY */}

      {/* 5. PORTFOLIO SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-[450px] bg-[#050505] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00FF00] rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-black fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">Your Arena</h3>
                    <p className="text-[10px] font-black italic tracking-widest text-[#00FF00]/60 uppercase">My Predictions</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-px bg-white/5">
                <div className="p-8 bg-[#050505]">
                  <div className="text-[10px] font-black italic tracking-widest text-white/20 uppercase mb-2">Total Power</div>
                  <div className="text-3xl font-black italic text-white leading-none">
                    {bets.reduce((acc: number, b: any) => acc + (b.amount / 1000000000), 0).toFixed(2)}
                    <span className="text-[#00FF00] text-sm ml-1">SOL</span>
                  </div>
                </div>
                <div className="p-8 bg-[#050505]">
                  <div className="text-[10px] font-black italic tracking-widest text-white/20 uppercase mb-2">Active Bets</div>
                  <div className="text-3xl font-black italic text-[#00FF00] leading-none">
                    {bets.filter((b: any) => !b.marketData?.status?.settled).length}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="p-4 bg-white/[0.02] border-b border-white/5 flex gap-2">
                {['ACTIVE', 'RESOLVED'].map((tab) => (
                  <button
                    key={tab}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black italic tracking-widest uppercase transition-all border border-transparent hover:border-white/10"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {bets.length > 0 ? (
                  bets.map((bet: any) => {
                    const market = bet.marketData;
                    if (!market) return null;

                    const findMatch = (eventId: string) => {
                      if (!eventId) return null;
                      const eventIdNorm = eventId.toUpperCase().replace(/-/g, ' ');

                      return markets.find(m => {
                        const mId = (m.id || "").toUpperCase();
                        const mSlug = (m.slug || "").toUpperCase().replace(/-/g, ' ');
                        const home = (m.homeShort || "").toUpperCase();
                        const away = (m.awayShort || "").toUpperCase();
                        const hAbbr = (m.homeAbbr || "").toUpperCase();
                        const aAbbr = (m.awayAbbr || "").toUpperCase();

                        // Stricter checks to avoid empty string matches
                        const idMatch = mId && eventIdNorm.includes(mId);
                        const slugMatch = mSlug && eventIdNorm.includes(mSlug);
                        const teamNameMatch = home && away && eventIdNorm.includes(home) && eventIdNorm.includes(away);
                        const teamAbbrMatch = hAbbr && aAbbr && eventIdNorm.includes(hAbbr) && eventIdNorm.includes(aAbbr);

                        return idMatch || slugMatch || teamNameMatch || teamAbbrMatch;
                      });
                    };

                    const isWinner = market.status?.settled && bet.outcomeId === market.winningOutcome;
                    const isLost = market.status?.settled && bet.outcomeId !== market.winningOutcome;
                    const isClaimable = isWinner && !bet.claimed;

                    return (
                      <div key={bet.publicKey.toBase58()} className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 space-y-4 hover:border-white/10 transition-all">
                        {(() => {
                          const match = findMatch(market.eventId);
                          const score = (match && match.homeShort && match.awayShort) ? getScoreForMarket(match.homeShort, match.awayShort) : null;
                          const isFinishedRealWorld = score?.status === 'FINAL';
                          const isSettledOnChain = !!market.status?.settled;
                          const isVerifying = !!isFinishedRealWorld && !isSettledOnChain;

                          return (
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-[9px] font-black italic tracking-widest text-white/40 uppercase mb-1">
                                  {isSettledOnChain ? 'COMPLETED' : isFinishedRealWorld ? 'FINISHED' : 'IN PLAY'}
                                </div>
                                <div className="text-sm font-black italic uppercase">
                                  {(() => {
                                    const parts = market.eventId.split('-');
                                    const awayCode = parts[1]?.toUpperCase();
                                    const homeCode = parts[2]?.toUpperCase();
                                    const awayName = TEAM_NAMES[awayCode] || awayCode || "AWAY";
                                    const homeName = TEAM_NAMES[homeCode] || homeCode || "HOME";
                                    return `${awayName} @ ${homeName}`;
                                  })()}
                                </div>
                                {score && score.status !== 'PRE' && (
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[10px] font-black italic text-[#00FF00]">{score.awayScore} - {score.homeScore}</span>
                                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">{score.clock || score.displayStatus}</span>
                                  </div>
                                )}
                              </div>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-black italic tracking-widest uppercase transition-all duration-500 ${isClaimable ? 'bg-[#00FF00] text-black animate-pulse shadow-[0_0_20px_rgba(0,255,0,0.4)] scale-110' :
                                (bet.claimed && isWinner) || isWinner ? 'bg-[#00FF00] text-black shadow-[0_0_30px_rgba(0,255,0,0.6)] scale-105 ml-4' :
                                  (bet.claimed && isLost) || isLost ? 'bg-red-500/20 text-red-500 border border-red-500/20' :
                                    isVerifying ? 'bg-amber-500/20 text-amber-500 animate-pulse' :
                                      'bg-blue-500/20 text-blue-500'
                                }`}>
                                {isClaimable ? 'READY TO CLAIM' :
                                  bet.claimed ? (isWinner ? 'WON' : 'LOST') :
                                    isVerifying ? 'VERIFYING RESULTS' :
                                      isWinner ? 'WON' :
                                        isLost ? 'LOST' :
                                          'ACTIVE'}
                              </div>
                            </div>
                          );
                        })()}

                        {(() => {
                          const isHome = bet.outcomeId === 0;
                          const parts = market.eventId.split('-');
                          const awayCode = parts[1]?.toUpperCase();
                          const homeCode = parts[2]?.toUpperCase();
                          const awayName = TEAM_NAMES[awayCode] || awayCode || "AWAY";
                          const homeName = TEAM_NAMES[homeCode] || homeCode || "HOME";

                          return (
                            <div className="text-[10px] font-black italic text-white/60 uppercase tracking-widest pb-2 border-b border-white/5">
                              {awayName} @ {homeName}
                            </div>
                          );
                        })()}

                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black italic text-[10px] overflow-hidden">
                              {(() => {
                                const match = findMatch(market.eventId);
                                const isHome = bet.outcomeId === 0;

                                let logo = isHome ? match?.homeLogo : match?.awayLogo;
                                let name = isHome ? (match?.homeShort || "HOME") : (match?.awayShort || "AWAY");

                                // Fallback: If no match found, parse from eventId
                                if (!match) {
                                  const parts = market.eventId.split('-');
                                  if (parts.length >= 3) {
                                    const sport = parts[0].toLowerCase();
                                    const awayCode = parts[1].toLowerCase();
                                    const homeCode = parts[2].toLowerCase();
                                    const code = isHome ? homeCode : awayCode;

                                    name = code.toUpperCase();
                                    logo = `https://a.espncdn.com/i/teamlogos/${sport === 'nba' ? 'nba' : 'sports'}/500/${code}.png`;
                                  }
                                }

                                if (logo) {
                                  return (
                                    <img
                                      src={logo}
                                      alt={name}
                                      className="w-[80%] h-[80%] object-contain"
                                      onError={(e) => { (e.target as any).style.display = 'none'; }}
                                    />
                                  );
                                }
                                return name.slice(0, 3);
                              })()}
                            </div>
                            <div>
                              <div className="text-[8px] font-black italic tracking-widest text-white/20 uppercase">Pick</div>
                              <div className="text-xs font-bold uppercase">
                                {(() => {
                                  const match = findMatch(market.eventId);
                                  const isHome = bet.outcomeId === 0;

                                  if (match) {
                                    return isHome ? (match.homeShort || "HOME") : (match.awayShort || "AWAY");
                                  }

                                  const parts = market.eventId.split('-');
                                  if (parts.length >= 3) {
                                    const awayCode = parts[1].toUpperCase();
                                    const homeCode = parts[2].toUpperCase();
                                    return isHome ? homeCode : awayCode;
                                  }

                                  return isHome ? "HOME" : "AWAY";
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-black italic tracking-widest text-white/20 uppercase">Stake</div>
                            <div className="text-xs font-black italic text-[#00FF00]">{(bet.amount / 1000000000).toFixed(3)} SOL</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {isClaimable && (
                            <button
                              disabled={isTxPending}
                              onClick={async () => {
                                try {
                                  const tx = await claimWinnings(market.eventId, market.devWallet.toBase58(), bet.owner.toBase58());
                                  if (tx) {
                                    setClaimTxs(prev => ({ ...prev, [bet.publicKey.toBase58()]: tx }));
                                  }
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="w-full py-3 bg-[#00FF00] text-black font-black italic uppercase tracking-widest text-[10px] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_20px_rgba(0,255,0,0.2)]"
                            >
                              {isTxPending ? 'CLAIMING...' : 'Claim Payout'}
                            </button>
                          )}
                          {claimTxs[bet.publicKey.toBase58()] && (
                            <a
                              href={`https://solscan.io/tx/${claimTxs[bet.publicKey.toBase58()]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2 border border-white/10 rounded-xl text-[8px] font-black italic tracking-widest uppercase text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                            >
                              View on Solscan
                              <ExternalLink className="w-2 h-2" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-20">
                    <Shield className="w-16 h-16" />
                    <p className="font-black italic uppercase tracking-widest text-sm leading-tight">No positions <br /> detected in the arena</p>
                  </div>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-8 bg-white/5 border-t border-white/5">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black italic tracking-widest uppercase hover:bg-white/5 transition-colors"
                >
                  Return to Arena
                </button>
              </div>
            </motion.div >
          </>
        )
        }
      </AnimatePresence >

      {/* DEBUG OVERLAY */}
      < div className="fixed bottom-6 right-6 z-[1000] p-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] font-mono flex flex-col gap-2 shadow-2xl pointer-events-none opacity-50 hover:opacity-100 transition-opacity" >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${mounted ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>MOUNTED: {mounted ? 'YES' : 'NO'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTxPending ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 opacity-20'}`} />
          <span>TX PENDING: {isTxPending ? 'YES' : 'NO'}</span>
        </div>
        <div className="border-t border-white/5 my-1" />
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>WALLET: {connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
        <div className="flex items-center gap-2 pl-4">
          <div className={`w-2 h-2 rounded-full ${publicKey ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>PK: {publicKey ? publicKey.toBase58().slice(0, 4) + '...' + publicKey.toBase58().slice(-4) : 'NONE'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${program ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>PROGRAM: {program ? 'READY' : 'NOT INITIALIZED'}</span>
        </div>
      </div >

    </main >
  );
}
