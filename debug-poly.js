// Built-in fetch

async function check() {
    const url = "https://gamma-api.polymarket.com/events?tag_id=1&active=true&closed=false&limit=500&sortBy=volume&sortOrder=desc";
    console.log("Fetching: " + url);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Total events found: " + data.length);

        const bball = data.filter(e => e.title.toUpperCase().includes("LAKERS") || e.title.toUpperCase().includes("ROCKETS") || e.title.toUpperCase().includes("HOU") || e.title.toUpperCase().includes("LAL"));

        console.log("Matches found: " + bball.length);
        bball.forEach(e => {
            console.log(`TITLE: [${e.title}] | ID: ${e.id} | Vol: ${e.volume}`);
        });

    } catch (e) {
        console.error(e);
    }
}

check();
