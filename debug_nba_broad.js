// Native fetch in Node 20


const POLYMARKET_EVENTS_URL = "https://gamma-api.polymarket.com/events";

async function testFetch() {
    const urls = [
        `${POLYMARKET_EVENTS_URL}?keywords=Celtics&active=true&closed=false&limit=20&sortBy=volume&sortOrder=desc`,
        `${POLYMARKET_EVENTS_URL}?keywords=Chiefs&active=true&closed=false&limit=20&sortBy=volume&sortOrder=desc`
    ];

    for (const url of urls) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`Error: ${res.status} ${res.statusText}`);
                continue;
            }
            const data = await res.json();
            console.log(`Result Count: ${data.length}`);
            if (data.length > 0) {
                console.log("First 5 titles:");
                data.slice(0, 5).forEach(e => console.log(`- ${e.title} (Vol: ${e.volume})`));

                // Check for a scheduled team
                const scheduled = data.find(e => e.title.includes("Celtics") || e.title.includes("Pacers") || e.title.includes("Chiefs"));
                if (scheduled) {
                    console.log(`\nFOUND SCHEDULED ITEM: ${scheduled.title} (Date: ${scheduled.startDate})`);
                } else {
                    console.log("\nWARNING: No Celtics/Pacers/Chiefs found in top 100.");
                }
            }
        } catch (e) {
            console.error("Fetch failed:", e.message);
        }
    }
}

testFetch();
