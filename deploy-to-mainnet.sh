#!/bin/bash
# Automated Solana Deployment Script for Codespaces
# Copy and paste this entire script into the Codespaces terminal

set -e  # Exit on error

echo "🚀 PolyBet - Automated Solana Deployment"
echo "=========================================="
echo ""

# Install Rust
echo "📦 Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install Solana
echo "⚡ Installing Solana CLI..."
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor
echo "⚓ Installing Anchor (this takes 10-15 minutes)..."
echo "☕ Go get coffee! This is the longest step."
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Make PATH permanent
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc

echo ""
echo "✅ All tools installed!"
echo ""

# Build the program
echo "🔨 Building Solana program..."
cd backend
anchor build

echo ""
echo "🎯 Getting Program ID..."
PROGRAM_ID=$(solana address -k target/deploy/sports_prediction-keypair.json)
echo "Your Program ID: $PROGRAM_ID"
echo ""

echo "⚠️  IMPORTANT: Update Program ID in these 3 files:"
echo "1. programs/sports_prediction/src/lib.rs (line 1)"
echo "2. Anchor.toml ([programs.mainnet] section)"
echo "3. ../frontend/app/hooks/useSportsProgram.ts"
echo ""
echo "Replace the placeholder with: $PROGRAM_ID"
echo ""
read -p "Press Enter after you've updated all 3 files..."

# Configure for mainnet
echo "🌐 Configuring for Solana Mainnet..."
solana config set --url mainnet-beta

# Create wallet
echo "💼 Creating wallet..."
echo "⚠️  SAVE THE SEED PHRASE THAT APPEARS!"
solana-keygen new

WALLET_ADDRESS=$(solana address)
echo ""
echo "💰 Your wallet address: $WALLET_ADDRESS"
echo ""
echo "Send 5 SOL to this address from an exchange"
echo ""
read -p "Press Enter after you've funded the wallet..."

# Check balance
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"

if [[ "$BALANCE" == "0 SOL" ]]; then
    echo "❌ Wallet not funded! Please add SOL and run the deploy command manually:"
    echo "   anchor build && anchor deploy"
    exit 1
fi

# Rebuild with correct Program ID
echo "🔨 Rebuilding with correct Program ID..."
anchor build

# Deploy!
echo "🚀 Deploying to Solana Mainnet..."
echo "⚠️  This will cost ~2-4 SOL"
read -p "Press Enter to deploy..."

anchor deploy

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo ""
echo "Your program is live at:"
echo "https://explorer.solana.com/address/$PROGRAM_ID?cluster=mainnet-beta"
echo ""
echo "Next steps:"
echo "1. Verify the Program ID is updated in your frontend"
echo "2. Test with a small bet (0.01 SOL)"
echo "3. Deploy frontend to Vercel"
echo ""
