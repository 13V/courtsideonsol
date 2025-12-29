import fetch from "node-fetch";

async function fetchPolymarket() {
    const url = 'https://clob.polymarket.com/markets?active=true&closed=false';
    console.log("Fetching Polymarket active markets...");
    try {
        const response = await fetch(url);
        const markets: any = await response.json();
        console.log("Total Markets:", markets.length);

        // Filter for NBA/Basketball and Moneyline
        const nbaMarkets = markets.filter((m: any) =>
            m.question?.toLowerCase().includes("nba") ||
            m.description?.toLowerCase().includes("nba") ||
            m.question?.toLowerCase().includes("spurs") ||
            m.question?.toLowerCase().includes("cavaliers")
        );

        console.log("Potential NBA Matches:", nbaMarkets.length);
        nbaMarkets.forEach((m: any) => {
            console.log(`- ID: ${m.condition_id} | Question: ${m.question}`);
            console.log(`  Slug: ${m.description} | EndDate: ${m.end_date_iso}`);
        });
    } catch (err) {
        console.error("Fetch Failed:", err);
    }
}

fetchPolymarket();
