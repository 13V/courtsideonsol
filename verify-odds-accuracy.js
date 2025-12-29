
async function verifyOddsAccuracy() {
    try {
        const res = await fetch('http://localhost:3000/api/markets');
        const data = await res.json();

        console.log("TOTAL NBA MARKETS:", data.length);

        const marketsWithOdds = data.filter(m => m.probA !== 50);
        console.log(`MARKETS WITH NON-50/50 ODDS: ${marketsWithOdds.length} / ${data.length}`);

        data.slice(0, 5).forEach(m => {
            console.log(`- ${m.fullName} | Odds: ${m.probA}% - ${m.probB}% | ID: ${m.id}`);
        });

        if (marketsWithOdds.length === 0) {
            console.log("WARNING: ALL MARKETS ARE STILL 50/50!");
        } else {
            console.log("SUCCESS: DIVERSE ODDS DETECTED!");
        }

    } catch (e) {
        console.error("VERIFICATION FAILED", e);
    }
}

verifyOddsAccuracy();
