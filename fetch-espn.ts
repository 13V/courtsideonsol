import fetch from "node-fetch";
import * as fs from 'fs';

async function fetchESPN() {
    const url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
    console.log("Fetching ESPN Scoreboard:", url);
    try {
        const response = await fetch(url);
        const data: any = await response.json();
        let output = `Total Events: ${data.events?.length}\n`;

        data.events?.forEach((e: any) => {
            const comp = e.competitions?.[0];
            const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.abbreviation;
            const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.abbreviation;
            output += `- Event: ${e.id} | ${away} vs ${home} | Date: ${e.date} | Status: ${e.status?.type?.name} (${e.status?.type?.detail})\n`;
        });

        fs.writeFileSync('espn_data.txt', output, 'utf8');
        console.log("Results written to espn_data.txt");
    } catch (err) {
        console.error("Fetch Failed:", err);
    }
}

fetchESPN();
