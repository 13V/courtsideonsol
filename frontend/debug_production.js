const POLYMARKET_EVENTS_URL = "https://gamma-api.polymarket.com/events";

// SCHEDULE SOURCE OF TRUTH (Dec 26 - Jan 2)
const WEEKLY_SCHEDULE = [
    { date: "2025-12-26", team: "Celtics", sport: "NBA" },
    { date: "2025-12-26", team: "Pacers", sport: "NBA" },
    { date: "2025-12-26", team: "Heat", sport: "NBA" },
    { date: "2025-12-26", team: "Hawks", sport: "NBA" },
    { date: "2025-12-26", team: "Suns", sport: "NBA" },
    { date: "2025-12-26", team: "Pelicans", sport: "NBA" },
    { date: "2025-12-26", team: "Lions", sport: "NFL" },
    { date: "2025-12-26", team: "Vikings", sport: "NFL" },
    { date: "2025-12-26", team: "Broncos", sport: "NFL" },
    { date: "2025-12-26", team: "Chiefs", sport: "NFL" },
];

async function debug() {
    console.log("Starting Debug Sequence...");

    // Tag IDs: NBA=745, limit=500 to dig deep
    const fetchUrls = [
        `${POLYMARKET_EVENTS_URL}?tag_id=745&active=true&closed=false&limit=500&sortBy=volume&sortOrder=desc`,
    ];

    const safeFetch = (url) => fetch(url).then(res => res.json()).catch(err => []);
    const results = await Promise.all(fetchUrls.map(safeFetch));
    const allEvents = results.flat();

    console.log(`\nRAW FETCHED EVENTS: ${allEvents.length}`);
    if (allEvents.length === 0) {
        console.log("CRITICAL: API returned 0 events.");
        return;
    }

    const now = new Date();
    let passed = 0;

    allEvents.forEach(e => {
        const titleUpper = e.title.toUpperCase();

        let reason = "";
        let isRejected = false;

        // 1. MATCH TYPE
        if (titleUpper.includes("WINNER") || titleUpper.includes("CHAMPION") || titleUpper.includes("MVP")) {
            reason = "FUTURES_DETECTED"; isRejected = true;
        } else if (!titleUpper.includes(" VS ") && !titleUpper.includes(" @ ")) {
            reason = "NO_VS_OR_AT"; isRejected = true;
        }

        // 2. SCHEDULE MATCH
        const scheduledMatch = WEEKLY_SCHEDULE.find(s => titleUpper.includes(s.team.toUpperCase()));
        if (!isRejected && !scheduledMatch) {
            reason = "NOT_IN_SCHEDULE"; isRejected = true;
        }

        // 3. TIME
        if (!isRejected && e.startDate) {
            const start = new Date(e.startDate).getTime();
            const diffHours = (start - now.getTime()) / 3600000;
            if (diffHours < -24 || diffHours > 48) {
                reason = `TIME_WINDOW (${diffHours.toFixed(1)}h)`; isRejected = true;
            }
        }

        if (isRejected) {
            console.log(`[REJECTED] ${e.title} -> ${reason}`);
        } else {
            passed++;
            console.log(`[ACCEPTED!] ${e.title} (Vol: ${e.volume})`);
        }
    });

    console.log(`\nSUMMARY: Passed ${passed} / ${allEvents.length}`);
}

debug();
