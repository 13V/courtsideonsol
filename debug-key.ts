import * as fs from 'fs';
import * as path from 'path';
import bs58 from 'bs58';

const devTxtPath = path.join(__dirname, 'scripts', 'authority.txt');
console.log(`Checking path: ${devTxtPath}`);

if (!fs.existsSync(devTxtPath)) {
    console.log("File not found!");
    process.exit(1);
}

const data = fs.readFileSync(devTxtPath, 'utf-8').trim();
console.log(`Raw data length: ${data.length}`);
console.log(`First 5 characters: ${data.substring(0, 5)}...`);

try {
    const decoded = bs58.decode(data);
    console.log(`Decoded length: ${decoded.length} bytes`);
} catch (e: any) {
    console.log(`Fails to decode: ${e.message}`);
}
