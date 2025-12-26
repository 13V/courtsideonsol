async function debug() {
    const url = "https://gamma-api.polymarket.com/markets?active=true&limit=20&order=volume&dir=desc";
    console.log("Fetching:", url);
    const res = await fetch(url);
    const data = await res.json();
    console.log("Count:", data.length);
    data.forEach((m, i) => {
        console.log(`${i}: [${m.category}] ${m.question} (Vol: ${m.volume})`);
    });
}
debug();
