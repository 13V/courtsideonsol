async function debug() {
    const slug = "nba-hou-lal-2025-12-25";
    const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
    // console.log("Fetching: " + url);
    try {
        const res = await fetch(url);
        const data = await res.json();

        // console.log("Events found: " + data.length);

        // data.forEach(e => {
        //     console.log(`SLUG: ${e.slug} | TITLE: ${e.title} | VOL: ${e.volume}`);
        // });

        if (data.length > 0) {
            const e = data[0];
            e.tags.forEach(t => console.log(`ID: ${t.id} | LABEL: ${t.label} | SLUG: ${t.slug}`));
        }

    } catch (e) {
        console.error(e);
    }
}

debug();
