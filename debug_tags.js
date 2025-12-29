const POLYMARKET_EVENTS_URL = "https://gamma-api.polymarket.com/events";

async function findTags() {
    const url = `${POLYMARKET_EVENTS_URL}?tag_id=1&active=true&closed=false&limit=500&sortBy=volume&sortOrder=desc`;
    try {
        const res = await fetch(url);
        const data = await res.json();

        const nflEvent = data.find(e => e.title.includes("NFL"));
        const nhlEvent = data.find(e => e.title.includes("NHL"));

        if (nflEvent) {
            console.log("\n--- NFL FOUND ---");
            console.log("Title: " + nflEvent.title);
            nflEvent.tags.forEach(t => console.log(`ID: ${t.id} | LABEL: ${t.label}`));
        } else {
            console.log("No NFL Found");
        }

        if (nhlEvent) {
            console.log("\n--- NHL FOUND ---");
            console.log("Title: " + nhlEvent.title);
            nhlEvent.tags.forEach(t => console.log(`ID: ${t.id} | LABEL: ${t.label}`));
        } else {
            console.log("No NHL Found");
        }

    } catch (e) { console.error(e); }
}

findTags();
