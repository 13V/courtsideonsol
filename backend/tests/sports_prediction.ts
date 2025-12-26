import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SportsPrediction } from "../target/types/sports_prediction";
import { expect } from "chai";

describe("sports_prediction", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.SportsPrediction as Program<SportsPrediction>;
    const authority = provider.wallet;
    const devWallet = anchor.web3.Keypair.generate();
    const eventId = "test_event_" + Math.random().toString(36).substring(7);

    const [marketPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("market"), Buffer.from(eventId)],
        program.programId
    );

    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), Buffer.from(eventId)],
        program.programId
    );

    it("Initializes a market!", async () => {
        const endTime = new anchor.BN(Date.now() / 1000 + 3600);
        const oracleFeed = anchor.web3.Keypair.generate().publicKey;

        await program.methods
            .initializeMarket(eventId, oracleFeed, devWallet.publicKey, endTime)
            .accounts({
                market: marketPda,
                vault: vaultPda,
                authority: authority.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        const marketAccount = await program.account.market.fetch(marketPda);
        expect(marketAccount.eventId).to.equal(eventId);
        expect(marketAccount.devWallet.toBase58()).to.equal(devWallet.publicKey.toBase58());
    });

    it("Places a bet!", async () => {
        const amount = new anchor.BN(1_000_000_000); // 1 SOL
        const outcome_id = 0;

        const [betPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("bet"), marketPda.toBuffer(), authority.publicKey.toBuffer()],
            program.programId
        );

        await program.methods
            .placeBet(outcome_id, amount)
            .accounts({
                market: marketPda,
                vault: vaultPda,
                userBet: betPda,
                user: authority.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        const marketAccount = await program.account.market.fetch(marketPda);
        expect(marketAccount.poolA.toNumber()).to.equal(amount.toNumber());
    });

    it("Locks the market!", async () => {
        await program.methods
            .lockMarket()
            .accounts({
                market: marketPda,
                authority: authority.publicKey,
            })
            .rpc();

        const marketAccount = await program.account.market.fetch(marketPda);
        expect(marketAccount.status).to.deep.equal({ locked: {} });
    });

    it("Settles the market!", async () => {
        await program.methods
            .settleMarket(0)
            .accounts({
                market: marketPda,
                authority: authority.publicKey,
            })
            .rpc();

        const marketAccount = await program.account.market.fetch(marketPda);
        expect(marketAccount.status).to.deep.equal({ settled: {} });
    });

    it("Claims winnings with 10% dev tax!", async () => {
        const [betPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("bet"), marketPda.toBuffer(), authority.publicKey.toBuffer()],
            program.programId
        );

        const initialDevBalance = await provider.connection.getBalance(devWallet.publicKey);

        await program.methods
            .claimWinnings()
            .accounts({
                market: marketPda,
                vault: vaultPda,
                devWallet: devWallet.publicKey,
                userBet: betPda,
                user: authority.publicKey,
                owner: authority.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        const finalDevBalance = await provider.connection.getBalance(devWallet.publicKey);
        expect(finalDevBalance).to.be.greaterThan(initialDevBalance);

        const betAccount = await program.account.userBet.fetch(betPda);
        expect(betAccount.claimed).to.be.true;
    });
});
