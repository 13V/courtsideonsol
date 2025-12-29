/* eslint-disable */
require('dotenv').config();
const { Connection } = require('@solana/web3.js');

async function check() {
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    console.log("Health check...");
}

check();
