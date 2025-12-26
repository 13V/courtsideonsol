#!/bin/bash
# Solana Development Environment Setup for WSL
# Run this script after WSL is installed and you've rebooted

echo "🚀 Setting up Solana development environment in WSL..."
echo ""

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "📦 Installing build dependencies..."
sudo apt install -y build-essential pkg-config libssl-dev libudev-dev

# Install Rust
echo "🦀 Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install Solana CLI
echo "⚡ Installing Solana CLI..."
sh -c "$(curl -sSfL https://release.solana.com/v1.18.4/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor
echo "⚓ Installing Anchor CLI (this takes 10-15 minutes)..."
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Verify installations
echo ""
echo "✅ Verifying installations..."
echo "Rust version:"
rustc --version
echo ""
echo "Solana version:"
solana --version
echo ""
echo "Anchor version:"
anchor --version

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure Solana for mainnet: solana config set --url mainnet-beta"
echo "2. Create/import your wallet: solana-keygen new"
echo "3. Fund your wallet with 5 SOL"
echo "4. Navigate to your project: cd /mnt/c/Users/Administrator/.gemini/antigravity/scratch/sports-prediction-site/backend"
echo "5. Deploy: anchor build && anchor deploy"
echo ""
