# Solana Program Mainnet Deployment Script
# Run this after Anchor finishes installing

Write-Host "🚀 Sports Prediction Platform - MAINNET Deployment" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  WARNING: You are deploying to MAINNET. This will cost real SOL." -ForegroundColor Yellow
Write-Host "   Make sure you have at least 5 SOL in your wallet for deployment." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Type 'DEPLOY' to continue with mainnet deployment"
if ($confirmation -ne "DEPLOY") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 0
}

# Set environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User") + ";C:\Users\Administrator\.cargo\bin;C:\Users\Administrator\.local\share\solana\install\active_release\bin"

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

Write-Host "📝 Step 3: CRITICAL - Update these files with your Program ID:" -ForegroundColor Red
Write-Host "  1. backend/programs/sports_prediction/src/lib.rs (line 1: declare_id!)" -ForegroundColor White
Write-Host "  2. backend/Anchor.toml ([programs.mainnet] section)" -ForegroundColor White
Write-Host "  3. frontend/app/hooks/useSportsProgram.ts (PROGRAM_ID constant)" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter after you've updated all 3 files..." -ForegroundColor Yellow
Read-Host

Write-Host "⚙️  Step 4: Configuring Solana for MAINNET..." -ForegroundColor Cyan
solana config set --url mainnet-beta

Write-Host "💰 Step 5: Checking wallet balance..." -ForegroundColor Cyan
$balance = solana balance
Write-Host "Current balance: $balance" -ForegroundColor Yellow

if ($balance -match "^0") {
    Write-Host "❌ Insufficient balance. You need at least 5 SOL for deployment." -ForegroundColor Red
    Write-Host "   Add SOL to your wallet and run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎯 Step 6: Deploying to MAINNET..." -ForegroundColor Green
Write-Host "   This will cost approximately 2-5 SOL depending on program size." -ForegroundColor Yellow
Write-Host ""

$finalConfirm = Read-Host "Type 'YES' to deploy to mainnet now"
if ($finalConfirm -ne "YES") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 0
}

anchor build
anchor deploy --provider.cluster mainnet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your program is now LIVE on Solana Mainnet!" -ForegroundColor Green
    Write-Host "Program ID: $programId" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Verify the Program ID is updated in frontend/app/hooks/useSportsProgram.ts" -ForegroundColor White
    Write-Host "2. Deploy your frontend to production (Vercel, Netlify, etc.)" -ForegroundColor White
    Write-Host "3. Run the oracle worker to automate market settlements" -ForegroundColor White
}
else {
    Write-Host "❌ Deployment failed. Check the errors above." -ForegroundColor Red
}
