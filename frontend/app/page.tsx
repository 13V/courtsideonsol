"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Play,
  RotateCcw,
  X,
  Wallet,
  Trophy,
  ChevronRight,
  Zap
} from 'lucide-react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useBetting } from './hooks/useBetting';

// --- TYPES ---
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
  volume: number;
  totalPool: number;
  isLive: boolean;
  image: string;
  history: number[];
  sportLabel: string;
  startDate?: string;
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
const KayoMarketCard = ({ market, onClick }: { market: Market; onClick: (m: Market) => void }) => {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const start = market.startDate ? new Date(market.startDate).getTime() : 0;
      if (start === 0) {
        setIsLive(true);
        return;
      }
      const now = Date.now();
      setIsLive(now >= start);
    };
    updateStatus();
    const timer = setInterval(updateStatus, 60000);
    return () => clearInterval(timer);
  }, [market.startDate]);

  const { placeBet, isTxPending } = useBetting();

  const handleBet = async (outcomeId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the card's onClick
    try {
      await placeBet(market.id, outcomeId, 0.1);
    } catch (err) {
      console.error(err);
    }
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
          <span className="font-mono text-white/5">${(market.volume).toLocaleString()} VOL</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* HOME SIDE */}
          <div
            onClick={(e) => handleBet(0, e)}
            className={`relative p-3 bg-[#080808] rounded-[24px] border border-white/5 transition-all flex items-center justify-between overflow-hidden group/btn cursor-pointer ${isTxPending ? 'opacity-50 pointer-events-none' : 'hover:border-[#00FF00]/40'}`}
            style={{ borderLeftWidth: '4px', borderLeftColor: market.homeColor || '#00FF00' }}
          >
            <TeamBadge name={market.homeShort} color={market.homeColor || '#00FF00'} logo={market.homeLogo} size="sm" />
            <div className="flex flex-col items-end gap-1.5 z-10 px-1">
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
            <div className="flex flex-col items-start gap-2 z-10 px-1">
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
              <a href="#" className="hover:text-[#00FF00] transition-colors">Protocol</a>
            </div>
            <WalletMultiButton className="!bg-[#00FF00] !text-black !rounded-2xl !font-black !text-xs !px-8 hover:!scale-105 transition-transform !uppercase !tracking-widest !shadow-[0_0_20px_rgba(0,255,0,0.2)]" />
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

          <div className="flex gap-4">
            <button className="px-8 py-3.5 rounded-2xl bg-[#00FF00] text-black text-[10px] font-black italic uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,255,0,0.2)]">
              Top Volume
            </button>
            <button className="px-8 py-3.5 rounded-2xl border border-white/10 text-white/40 text-[10px] font-black italic uppercase tracking-widest hover:text-white transition-colors">
              Recent
            </button>
          </div>
        </div>

        {/* FEED GRID */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
            {markets.map((market) => (
              <KayoMarketCard key={market.id} market={market} onClick={setSelectedMarket} />
            ))}
            {markets.length === 0 && (
              <div className="col-span-full h-96 flex flex-col items-center justify-center text-white/10 border-4 border-white/[0.02] border-dashed rounded-[60px] bg-white/[0.01]">
                <Activity className="w-20 h-20 mb-6 opacity-5" />
                <p className="font-black italic text-3xl uppercase tracking-widest">Signal Lost: No Broadcasts</p>
              </div>
            )}
          </div>
        )}

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
              <div className="relative aspect-video">
                <img src={selectedMarket.image} className="w-full h-full object-cover opacity-40 shadow-inner" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                <button onClick={() => setSelectedMarket(null)} className="absolute top-8 right-8 p-4 bg-black/50 hover:bg-white/10 rounded-full transition border border-white/10">
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                  <h2 className="text-4xl lg:text-5xl font-black italic uppercase leading-none tracking-tighter mb-4 drop-shadow-2xl">
                    {selectedMarket.fullName}
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="px-5 py-2 bg-[#00FF00] text-black text-[10px] font-black italic tracking-widest uppercase rounded-full">
                      Head to Head
                    </div>
                    <div className="text-white/40 font-mono text-xs">
                      ID: {selectedMarket.id.slice(-8)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-12 space-y-10">
                <div className="grid grid-cols-2 gap-6">
                  <button className="p-8 bg-white/[0.03] border-2 border-white/5 rounded-[40px] hover:border-[#00FF00]/40 transition-all group flex flex-col items-center gap-4">
                    <TeamBadge name={selectedMarket.homeShort} color={selectedMarket.homeColor || "#00FF00"} />
                    <div className="text-center">
                      <div className="text-[10px] font-black italic tracking-widest text-[#00FF00] uppercase mb-1">CALL {selectedMarket.homeShort}</div>
                      <div className="text-5xl font-black italic">{selectedMarket.probA}%</div>
                    </div>
                  </button>
                  <button className="p-8 bg-white/[0.03] border-2 border-white/5 rounded-[40px] hover:border-[#FF0033]/40 transition-all group flex flex-col items-center gap-4">
                    <TeamBadge name={selectedMarket.awayShort} color={selectedMarket.awayColor || "#FF0033"} />
                    <div className="text-center">
                      <div className="text-[10px] font-black italic tracking-widest text-[#FF0033] uppercase mb-1">CALL {selectedMarket.awayShort}</div>
                      <div className="text-5xl font-black italic">{100 - selectedMarket.probA}%</div>
                    </div>
                  </button>
                </div>

                <button className="w-full py-6 bg-[#00FF00] text-black font-black text-2xl uppercase italic tracking-widest rounded-[32px] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(0,255,0,0.1)]">
                  Execute Position
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
