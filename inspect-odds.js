
const POLYMARKET_EVENTS_URL = "https://gamma-api.polymarket.com/events";

async function deepInspect() {
    try {
        const today = "2025-12-28";
        const url = `${POLYMARKET_EVENTS_URL}?tag_id=745&event_date=${today}`;
        const res = await fetch(url);
        const data = await res.json();

        const event = data.find(e => e.title.includes("Warriors vs. Raptors") || e.title.includes("76ers vs. Thunder"));
        if (!event) {
            console.log("EVENT NOT FOUND");
            return;
        }

        console.log(`DEEP INSPECT: ${event.title}`);
        console.log(`TOTAL MARKETS: ${event.markets.length}`);

        event.markets.forEach((m, i) => {
            console.log(`MARKET #${i}: ${m.question}`);
            console.log(`  outcomePrices: ${JSON.stringify(m.outcomePrices)}`);
            console.log(`  active: ${m.active}`);
        });

    } catch (e) {
        console.error("FAILED", e);
    }
}

deepInspect();
