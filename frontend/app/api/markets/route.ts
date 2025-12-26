import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const POLYMARKET_EVENTS_URL = "https://gamma-api.polymarket.com/events";

const TEAM_DATA: Record<string, { logo: string, color: string }> = {
    // NBA
    "LAKERS": { logo: "lal", color: "#FDB927" },
    "WARRIORS": { logo: "gs", color: "#1D428A" },
    "CELTICS": { logo: "bos", color: "#007A33" },
    "KNICKS": { logo: "ny", color: "#F58426" },
    "NETS": { logo: "bkn", color: "#000000" },
    "BUCKS": { logo: "mil", color: "#00471B" },
    "76ERS": { logo: "phi", color: "#006BB6" },
    "HEAT": { logo: "mia", color: "#98002E" },
    "BULLS": { logo: "chi", color: "#CE1141" },
    "MAVERICKS": { logo: "dal", color: "#00538C" },
    "SUNS": { logo: "phx", color: "#1D1160" },
    "NUGGETS": { logo: "den", color: "#0E2240" },
    "TIMBERWOLVES": { logo: "min", color: "#0C2340" },
    "CLIPPERS": { logo: "lac", color: "#C8102E" },
    "ROCKETS": { logo: "hou", color: "#CE1141" },
    "PACERS": { logo: "ind", color: "#002D62" },
    "BLAZERS": { logo: "por", color: "#E03A3E" },
    "TRAIL BLAZERS": { logo: "por", color: "#E03A3E" },
    "PELICANS": { logo: "no", color: "#0C2340" },
    "HORNETS": { logo: "cha", color: "#00788C" },
    "GRIZZLIES": { logo: "mem", color: "#5D76A9" },
    "THUNDER": { logo: "okc", color: "#007AC1" },
    "JAZZ": { logo: "utah", color: "#002B5C" },
    "SPURS": { logo: "sas", color: "#C4CED4" },
    // NFL
    "CHIEFS": { logo: "kc", color: "#E31837" },
    "EAGLES": { logo: "phi", color: "#004C54" },
    "COWBOYS": { logo: "dal", color: "#003594" },
    "LIONS": { logo: "det", color: "#0076B6" },
    "VIKINGS": { logo: "min", color: "#4F2683" },
    "BRONCOS": { logo: "den", color: "#FB4F14" },
    "COMMANDERS": { logo: "wsh", color: "#5A1414" },
    "BILLS": { logo: "buf", color: "#00338D" },
    "49ERS": { logo: "sf", color: "#AA0000" },
    "RAVENS": { logo: "bal", color: "#241773" },
    "PACKERS": { logo: "gb", color: "#203731" },
    "BEARS": { logo: "chi", color: "#0B162A" },
    "TEXANS": { logo: "hou", color: "#03202F" },
    "GIANTS": { logo: "nyg", color: "#0B2265" },
    "SEAHAWKS": { logo: "sea", color: "#002244" },
    "BENGALS": { logo: "cin", color: "#FB4F14" },
    // NHL
    "RANGERS": { logo: "nyr", color: "#0038A8" },
    "ISLANDERS": { logo: "nyi", color: "#00539E" },
    "LIGHTNING": { logo: "tb", color: "#002868" },
    "SENATORS": { logo: "ott", color: "#C52032" },
    "MAPLE LEAFS": { logo: "tor", color: "#00205B" },
    "KRAKEN": { logo: "sea", color: "#001628" },
    "KNIGHTS": { logo: "vgk", color: "#B4975A" },
    "BRUINS": { logo: "bos", color: "#FFB81C" },
};

const findTeamDetails = (name: string) => {
    const n = name.toUpperCase();
    for (const [key, data] of Object.entries(TEAM_DATA)) {
        if (n.includes(key)) return data;
    }
    return null;
};

const getLogoUrl = (sport: string, abbr: string) => {
    if (!abbr) return null;
    let s = sport.toLowerCase();
    if (s === "basketball" || s === "nba") s = "nba";
    if (s === "american football" || s === "nfl") s = "nfl";
    if (s === "hockey" || s === "nhl") s = "nhl";
    return `https://a.espncdn.com/i/teamlogos/${s}/500/${abbr}.png`;
};

const DEFAULT_COLOR = "#00FF00"; // Neon Green
const SPORT_IMAGE_MAP: Record<string, string> = {
    "NBA": "/graphics/nba_arena.png",
    "BASKETBALL": "/graphics/nba_arena.png",
    "NFL": "/graphics/nfl_stadium.png",
    "AMERICAN FOOTBALL": "/graphics/nfl_stadium.png",
    "NHL": "/graphics/nhl_arena.png",
    "HOCKEY": "/graphics/nhl_arena.png",
};
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1600&auto=format&fit=crop";

export async function GET() {
    try {
        // Tag IDs: NBA=745, NFL=450, NHL=899
        // Increase limit to 200 per tag to dig deeper than just futures
        const fetchUrls = [
            `${POLYMARKET_EVENTS_URL}?tag_id=745&active=true&closed=false&limit=200&sortBy=volume&sortOrder=desc`,
            `${POLYMARKET_EVENTS_URL}?tag_id=450&active=true&closed=false&limit=200&sortBy=volume&sortOrder=desc`,
            `${POLYMARKET_EVENTS_URL}?tag_id=899&active=true&closed=false&limit=200&sortBy=volume&sortOrder=desc`,
        ];

        // Safe Fetch Wrapper
        const safeFetch = (url: string) => fetch(url, { cache: 'no-store' })
            .then(res => res.ok ? res.json() : [])
            .catch(err => {
                console.error(`Fetch failed for ${url}:`, err);
                return [];
            });

        // Parallel Execution
        const results = await Promise.all(fetchUrls.map(safeFetch));

        // Flatten & Deduplicate
        const eventMap = new Map();
        results.flat().forEach((e: any) => {
            // Basic validity check
            if (e && e.id && e.title) {
                e.volume = parseFloat(String(e.volume || "0").replace(/,/g, ''));
                eventMap.set(e.id, e);
            }
        });
        const events = Array.from(eventMap.values());

        // --- ROBUST HYBRID FILTER ---
        // We removed strict date/schedule checking because it was causing false "No Data".
        // Instead, we rely on strict "Head to Head" structure detection to kill futures.
        const CORE_SPORTS = ["NBA", "NFL", "NHL"];

        let filtered = events.filter((e: any) => {
            // NORMALIZE TITLE: "Pelicans vs. Bulls" -> "PELICANS VS BULLS"
            const titleUpper = e.title.toUpperCase().replace(/\./g, "").replace(/\s+/g, " ");

            // 1. MUST BE A MATCH (Head-to-Head)
            if (titleUpper.includes("WINNER") || titleUpper.includes("CHAMPION") || titleUpper.includes("MVP")) return false;

            // ROBUST VS CHECK
            const isMatchup = titleUpper.includes(" VS ") || titleUpper.includes(" @ ");
            if (!isMatchup) return false;

            // 2. VOLUME FILTER (Sanity Check)
            if (e.volume < 10) return false;

            return true;
        });

        // --- INTELLIGENT SPORT DETECTION (REFINED) ---
        const getSportFromTeam = (title: string): string => {
            const t = title.toUpperCase();

            // 1. TEAM-SPECIFIC PRIORITY (Check for unique team names first)
            const nbaTeams = ["LAKERS", "WARRIORS", "CELTICS", "KNICKS", "BUCKS", "SUNS", "MAVERICKS", "76ERS", "BULLS", "CLIPPERS", "NUGGETS", "TIMBERWOLVES", "HEAT", "ROCKETS", "PACERS", "BLAZERS", "NETS", "PELICANS", "SPURS", "JAZZ", "GRIZZLIES", "THUNDER", "HORNETS", "CAVALIERS", "MAGIC", "RAPTORS", "WIZARDS", "HAWKS", "PISTONS", "KINGS"];
            const nflTeams = ["CHIEFS", "EAGLES", "BILLS", "BEARS", "COWBOYS", "VIKINGS", "LIONS", "BRONCOS", "COMMANDERS", "49ERS", "GIANTS", "PACKERS", "RAVENS", "TEXANS", "SEAHAWKS", "BENGALS", "DOLPHINS", "JETS", "PATRIOTS", "STEELERS", "BROWNS", "COLTS", "JAGUARS", "TITANS", "RAIDERS", "CHARGERS", "RAMS", "CARDINALS", "SAINTS", "FALCONS", "BUCCANEERS", "PANTHERS"];
            const nhlTeams = ["RANGERS", "ISLANDERS", "LIGHTNING", "SENATORS", "MAPLE LEAFS", "KRAKEN", "KNIGHTS", "BRUINS", "PENGUINS", "CAPITALS", "FLYERS", "DEVILS", "HURRICANES", "PANTHERS", "RED WINGS", "STARS", "AVALANCHE", "PREDATORS", "BLUES", "WILD", "JETS", "CANUCKS", "OILERS", "FLAMES", "KINGS", "DUCKS", "SHARKS", "COYOTES", "SABRES", "CANADIENS"];

            if (nflTeams.some(k => t.includes(k))) return "NFL";
            if (nbaTeams.some(k => t.includes(k))) return "NBA";
            if (nhlTeams.some(k => t.includes(k))) return "NHL";

            // 2. LEAGUE FALLBACK
            if (t.includes("NFL") || t.includes("AMERICAN FOOTBALL")) return "NFL";
            if (t.includes("NBA") || t.includes("BASKETBALL")) return "NBA";
            if (t.includes("NHL") || t.includes("HOCKEY")) return "NHL";

            return "Sports";
        };

        // Map to Frontend Model
        const mapped = filtered.map((e: any) => {
            const titleUpper = e.title.toUpperCase();
            const sportLabel = getSportFromTeam(titleUpper);

            // Parse Teams
            const parts = e.title.toUpperCase().replace(/\./g, "").split(/(?: VS | @ )/i);
            const home = parts[0] || "Home";
            const away = parts[1] || "Away";

            // Colors & Logos (Fuzzy Matching)
            const homeInfo = findTeamDetails(home);
            const awayInfo = findTeamDetails(away);

            const homeColor = homeInfo?.color || DEFAULT_COLOR;
            const awayColor = awayInfo?.color || DEFAULT_COLOR;
            const homeLogo = getLogoUrl(sportLabel, homeInfo?.logo || "");
            const awayLogo = getLogoUrl(sportLabel, awayInfo?.logo || "");

            return {
                id: String(e.id),
                slug: e.slug,
                marketType: "HEAD TO HEAD",
                fullName: e.title,
                homeShort: home,
                awayShort: away,
                homeColor,
                awayColor,
                homeLogo,
                awayLogo,
                probA: Math.floor(Math.random() * 40) + 30,
                volume: e.volume,
                totalPool: e.volume,
                isLive: e.active,
                image: SPORT_IMAGE_MAP[sportLabel] || DEFAULT_IMAGE,
                history: Array.from({ length: 20 }, () => 40 + Math.random() * 20),
                sportLabel: sportLabel,
                startDate: e.startDate
            };
        });

        const sorted = mapped.sort((a: any, b: any) => b.volume - a.volume);

        return NextResponse.json(sorted, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Refresh-Time': Date.now().toString()
            }
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json([], { status: 500 });
    }
}
