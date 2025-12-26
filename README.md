# Sports Prediction Platform 🏀⚡

A decentralized sports prediction platform built on Solana with real-time odds, market locking, and automated settlements.

## Features

- ✅ **Solana Smart Contract** - Secure, on-chain betting with PDA vaults
- ✅ **10% Protocol Tax** - Automated fee collection for buybacks
- ✅ **Market Locking** - Prevents late bets and front-running
- ✅ **Dynamic Odds** - Real-time probability-based returns
- ✅ **Premium UI** - Neon pulse animations and broadcast-quality design
- ✅ **Wallet Integration** - Phantom, Solflare, and more

## Quick Start (GitHub Codespaces)

### 1. Open in Codespaces

Click the green "Code" button → "Codespaces" → "Create codespace on main"

### 2. Install Dependencies

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor (takes 10-15 minutes)
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

### 3. Deploy to Mainnet

```bash
cd backend

# Build
anchor build

# Get Program ID
solana address -k target/deploy/sports_prediction-keypair.json

# Update Program ID in these 3 files:
# 1. programs/sports_prediction/src/lib.rs (line 1: declare_id!)
# 2. Anchor.toml ([programs.mainnet] section)
# 3. ../frontend/app/hooks/useSportsProgram.ts (PROGRAM_ID constant)

# Configure for mainnet
solana config set --url mainnet-beta

# Create wallet
solana-keygen new

# Fund with 5 SOL (get address: solana address)

# Rebuild and deploy
anchor build
anchor deploy
```

## Project Structure

```
sports-prediction-site/
├── backend/
│   ├── programs/
│   │   └── sports_prediction/
│   │       └── src/
│   │           └── lib.rs          # Solana smart contract
│   ├── tests/                       # Anchor tests
│   └── Anchor.toml                  # Anchor configuration
│
└── frontend/
    ├── app/
    │   ├── components/
    │   │   └── SolanaProvider.tsx   # Wallet provider
    │   ├── hooks/
    │   │   ├── useSportsProgram.ts  # Program interaction
    │   │   └── useBetting.ts        # Betting logic
    │   ├── api/
    │   │   └── markets/             # Polymarket API integration
    │   └── page.tsx                 # Main UI
    └── package.json
```

## Smart Contract Features

- **Market Initialization** - Create new prediction markets
- **Place Bet** - Users bet SOL on outcomes
- **Market Locking** - Prevent bets after game starts
- **Settlement** - Oracle-based result finalization
- **Claim Winnings** - Users claim with 10% protocol fee

## Frontend Features

- **Next.js 16** - React framework
- **Tailwind CSS** - Utility-first styling
- **Solana Wallet Adapter** - Multi-wallet support
- **Polymarket Integration** - Real-time market data
- **Dynamic Odds** - Probability-based returns

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend (Local Testing)
```bash
cd backend
anchor test
```

## Deployment Costs

- **Program Deployment**: ~2-4 SOL (one-time)
- **Market Creation**: ~0.01 SOL per market
- **User Transactions**: Paid by users

## License

MIT
