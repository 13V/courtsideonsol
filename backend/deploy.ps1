# Solana Program Deployment Script
# Run this after Anchor finishes installing

Write-Host "🚀 Sports Prediction Platform - Solana Deployment" -ForegroundColor Green
Write-Host ""

# Set environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") + ";C:\Users\Administrator\.cargo\bin;C:\Users\Administrator\.local\share\solana\install\active_release\bin"

# Navigate to backend
cd C:\Users\Administrator\.gemini\antigravity\scratch\sports-prediction-site\backend

Write-Host "📦 Step 1: Building the Solana program..." -ForegroundColor Cyan
anchor build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

Write-Host "🔑 Step 2: Getting Program ID..." -ForegroundColor Cyan
$programId = solana address -k target/deploy/sports_prediction-keypair.json
Write-Host "Program ID: $programId" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 Step 3: Update these files with your Program ID:" -ForegroundColor Cyan
Write-Host "  1. backend/programs/sports_prediction/src/lib.rs (line 1: declare_id!)" -ForegroundColor White
Write-Host "  2. backend/Anchor.toml ([programs.devnet] section)" -ForegroundColor White
Write-Host "  3. frontend/app/hooks/useSportsProgram.ts (PROGRAM_ID constant)" -ForegroundColor White
Write-Host ""

Write-Host "⚙️  Step 4: Configuring Solana for Devnet..." -ForegroundColor Cyan
solana config set --url devnet

Write-Host "💰 Step 5: Requesting airdrop (2 SOL for deployment)..." -ForegroundColor Cyan
solana airdrop 2

Write-Host ""
Write-Host "🎯 Ready to deploy! Run these commands:" -ForegroundColor Green
Write-Host "  anchor build" -ForegroundColor White
Write-Host "  anchor deploy" -ForegroundColor White
Write-Host ""
Write-Host "📚 Full guide: C:\Users\Administrator\.gemini\antigravity\brain\53f648d9-9526-4509-a367-5e62088ff223\BACKEND_FINAL_STEPS.md" -ForegroundColor Cyan
