
const POLYMARKET_EVENTS_URL = "https://gamma-api.polymarket.com/events";

async function main() {
    try {
        console.log("Fetching markets...");
        // Match the logic in route.ts exactly
        const response = await fetch(`${POLYMARKET_EVENTS_URL}?tag_id=1&active=true&closed=false&limit=200&sortBy=volume&sortOrder=desc`);

        if (!response.ok) {
            console.error("Failed to fetch:", response.status, response.statusText);
            return;
        }

        const events = await response.json();
        console.log(`Fetched ${events.length} raw events.`);

        const sportsKeywords = [
            "nba", "nfl", "mlb", "nhl", "soccer", "football", "cricket", "afl", "nrl",
            "tennis", "f1", "ufc", "boxing", "premier league", "champions league",
            "lal", "gsw", "celtics", "warriors", "lakers", "knicks", "bulls",
            "manchester", "chelsea", "liverpool", "arsenal", "real madrid", "barcelona"
        ];

        const now = new Date();

        const sportsEvents = events.filter((e) => {
            const title = (e.title || "").toLowerCase();
            const tags = (e.tags || []).map((t) => (t.label || "").toLowerCase());

            // Simple check: is it in a sports-related tag or does the title match a keyword?
            const isSport = tags.some(t => t.includes("sport") || t.includes("nfl") || t.includes("nba") || t.includes("mlb") || t.includes("soccer")) ||
                sportsKeywords.some(k => title.includes(k));

            if (!isSport) return false;

            // If it's active and not closed, we keep it. Period.
            if (e.active && !e.closed) return true;

            // Otherwise, if it ended very recently (last 12h) or ends soon (10 days)
            const mainMarket = e.markets?.[0] || {};
            const endDateString = mainMarket.endDate || e.endDate;
            if (endDateString && !e.closed) {
                const endDate = new Date(endDateString);
                const diffMs = endDate.getTime() - now.getTime();
                return diffMs >= -12 * 3600000 && diffMs <= 10 * 24 * 3600000;
            }

            return false;
        });

        console.log(`Filtered down to ${sportsEvents.length} sports events.`);

        const sorted = sportsEvents.sort((a, b) => {
            const aTitle = (a.title || "").toLowerCase();
            const bTitle = (b.title || "").toLowerCase();
            const aIsMatch = aTitle.includes(" vs ") || aTitle.includes(" vs. ") || aTitle.includes(" @ ");
            const bIsMatch = bTitle.includes(" vs ") || bTitle.includes(" vs. ") || bTitle.includes(" @ ");

            if (aIsMatch && !bIsMatch) return -1;
            if (!aIsMatch && bIsMatch) return 1;

            const volA = parseFloat(a.volume || "0");
            const volB = parseFloat(b.volume || "0");
            return volB - volA;
        }).slice(0, 50);

        console.log("Top 10 Resolved Markets:");
        sorted.slice(0, 10).forEach(e => {
            console.log(`[${e.id}] ${e.title} | Active: ${e.active} | Tags: ${(e.tags || []).map(t => t.label).join(", ")}`);
        });

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
