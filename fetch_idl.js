const { Program, AnchorProvider } = require('@coral-xyz/anchor');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const fs = require('fs');

const PROGRAM_ID = '5oCaNW77tTwpAdZqhyebZ73zwm1DtfR3Ye7Cy9VWyqtT';

async function fetchIdl() {
    try {
        console.log('Fetching IDL from program:', PROGRAM_ID);

        // Connect to mainnet-beta
        const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

        // Fetch IDL from chain
        const programId = new PublicKey(PROGRAM_ID);

        // Try to fetch the IDL account
        const idl = await Program.fetchIdl(programId, {
            connection
        });

        if (!idl) {
            console.error('No IDL found on chain for this program');
            process.exit(1);
        }

        console.log('IDL fetched successfully!');

        // Save to file
        const outputPath = './app/idl/sports_prediction.json';
        fs.writeFileSync(outputPath, JSON.stringify(idl, null, 2));
        console.log('IDL saved to:', outputPath);

    } catch (error) {
        console.error('Error fetching IDL:', error);
        process.exit(1);
    }
}

fetchIdl();
