/* eslint-disable @typescript-eslint/no-require-imports */
const { sha256 } = require("js-sha256");

function getDiscriminator(name) {
    const hash = sha256.digest(`account:${name}`);
    return Array.from(hash.slice(0, 8));
}

console.log("Market:", JSON.stringify(getDiscriminator("Market")));
console.log("UserBet:", JSON.stringify(getDiscriminator("UserBet")));
