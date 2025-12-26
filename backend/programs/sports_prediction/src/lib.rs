use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("SportsPred11111111111111111111111111111111");

#[program]
pub mod sports_prediction {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        event_id: String,
        oracle_feed: Pubkey,
        dev_wallet: Pubkey,
        end_time: i64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.event_id = event_id;
        market.oracle_feed = oracle_feed;
        market.dev_wallet = dev_wallet;
        market.end_time = end_time;
        market.pool_a = 0;
        market.pool_b = 0;
        market.total_pool = 0;
        market.status = MarketStatus::Open;
        market.authority = ctx.accounts.authority.key();
        market.winning_outcome = 0;
        market.vault_bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        outcome_id: u8, // 0 for A, 1 for B
        amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        require!(market.status == MarketStatus::Open, PredictionError::MarketNotOpen);
        require!(Clock::get()?.unix_timestamp < market.end_time, PredictionError::MarketExpired);
        require!(outcome_id <= 1, PredictionError::InvalidOutcome);

        // Transfer SOL to market vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;
        
        if outcome_id == 0 {
            market.pool_a += amount;
        } else {
            market.pool_b += amount;
        }
        
        market.total_pool += amount;

        user_bet.market = market.key();
        user_bet.owner = ctx.accounts.user.key();
        user_bet.outcome_id = outcome_id;
        user_bet.amount += amount; // Allow top-ups
        user_bet.claimed = false;

        Ok(())
    }

    pub fn lock_market(ctx: Context<LockMarket>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(ctx.accounts.authority.key() == market.authority, PredictionError::Unauthorized);
        require!(market.status == MarketStatus::Open, PredictionError::InconsistentState);

        market.status = MarketStatus::Locked;
        Ok(())
    }

    pub fn settle_market(
        ctx: Context<SettleMarket>,
        winning_outcome: u8,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(ctx.accounts.authority.key() == market.authority, PredictionError::Unauthorized);
        require!(winning_outcome <= 1, PredictionError::InvalidOutcome);
        
        market.status = MarketStatus::Settled;
        market.winning_outcome = winning_outcome;
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        require!(market.status == MarketStatus::Settled, PredictionError::MarketNotSettled);
        require!(!user_bet.claimed, PredictionError::AlreadyClaimed);
        require!(user_bet.outcome_id == market.winning_outcome, PredictionError::LostBet);

        let winning_pool = if market.winning_outcome == 0 {
            market.pool_a
        } else {
            market.pool_b
        };

        require!(winning_pool > 0, PredictionError::InconsistentState);

        // Calculation: (user_amount / winning_pool) * total_pool
        // We multiply before divide to maintain precision
        let total_payout = (user_bet.amount as u128)
            .checked_mul(market.total_pool as u128)
            .unwrap()
            .checked_div(winning_pool as u128)
            .unwrap() as u64;

        // 10% Developer Tax
        let dev_fee = total_payout / 10;
        let user_payout = total_payout.checked_sub(dev_fee).unwrap();

        user_bet.claimed = true;

        // Seeds for vault signing
        let event_id = market.event_id.clone();
        let seeds = &[
            b"vault",
            event_id.as_bytes(),
            &[market.vault_bump],
        ];
        let signer = &[&seeds[..]];

        // 1. Transfer Fee to Dev Wallet
        let dev_cpi = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.dev_wallet.to_account_info(),
            },
            signer,
        );
        system_program::transfer(dev_cpi, dev_fee)?;

        // 2. Transfer Remaining to User
        let user_cpi = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            signer,
        );
        system_program::transfer(user_cpi, user_payout)?;

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MarketStatus {
    Open,
    Locked,
    Settled,
}

#[account]
pub struct Market {
    pub event_id: String,       // max 32 bytes + prefix
    pub oracle_feed: Pubkey,
    pub dev_wallet: Pubkey,
    pub pool_a: u64,
    pub pool_b: u64,
    pub total_pool: u64,
    pub end_time: i64,
    pub status: MarketStatus,
    pub authority: Pubkey,
    pub winning_outcome: u8,
    pub vault_bump: u8,
}

#[account]
pub struct UserBet {
    pub market: Pubkey,
    pub owner: Pubkey,
    pub outcome_id: u8,
    pub amount: u64,
    pub claimed: bool,
}

#[derive(Accounts)]
#[instruction(event_id: String)]
pub struct InitializeMarket<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 36 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 32 + 1 + 1,
        seeds = [b"market", event_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [b"vault", event_id.as_bytes()],
        bump
    )]
    /// CHECK: PDA used as vault
    pub vault: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"market", market.event_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [b"vault", market.event_id.as_bytes()],
        bump = market.vault_bump
    )]
    /// CHECK: Correct vault seeds
    pub vault: AccountInfo<'info>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 32 + 1 + 8 + 1,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LockMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SettleMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"market", market.event_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        seeds = [b"vault", market.event_id.as_bytes()],
        bump = market.vault_bump
    )]
    /// CHECK: Vault to transfer from
    pub vault: AccountInfo<'info>,
    #[account(
        mut,
        address = market.dev_wallet
    )]
    /// CHECK: Developer wallet for buybacks
    pub dev_wallet: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"bet", market.key().as_ref(), user.key().as_ref()],
        bump,
        has_one = owner @ PredictionError::Unauthorized
    )]
    pub user_bet: Account<'info, UserBet>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: User to pay
    pub owner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum PredictionError {
    #[msg("Market is not open for betting")]
    MarketNotOpen,
    #[msg("Market is locked")]
    MarketLocked,
    #[msg("Market is not settled yet")]
    MarketNotSettled,
    #[msg("Betting period has expired")]
    MarketExpired,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Invalid outcome ID")]
    InvalidOutcome,
    #[msg("Already claimed winnings")]
    AlreadyClaimed,
    #[msg("This bet did not win")]
    LostBet,
    #[msg("Internal state inconsistency")]
    InconsistentState,
}
