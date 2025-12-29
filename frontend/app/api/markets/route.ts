import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const POLYMARKET_EVENTS_URL = "https://gamma-api.polymarket.com/events";

interface TeamData {
    logo: string;
    color: string;
}

const TEAM_DATA: Record<string, TeamData> = {
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
    "MAGIC": { logo: "orl", color: "#0077C0" },
    "RAPTORS": { logo: "tor", color: "#CE1141" },
    "HAWKS": { logo: "atl", color: "#E03A3E" },
    "WIZARDS": { logo: "was", color: "#002B5C" },
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
        const nowObj = new Date();
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        const today = formatDate(nowObj);
        const tomorrow = formatDate(new Date(nowObj.getTime() + 24 * 60 * 60 * 1000));
        const yesterday = formatDate(new Date(nowObj.getTime() - 24 * 60 * 60 * 1000));

        const fetchUrls = [
            `${POLYMARKET_EVENTS_URL}?tag_id=745&event_date=${today}`,
            `${POLYMARKET_EVENTS_URL}?tag_id=745&event_date=${tomorrow}`,
            // High volume fallback for broader discovery if needed
            `${POLYMARKET_EVENTS_URL}?tag_id=745&active=true&limit=100&sortBy=volume&sortOrder=desc`,
        ];

        // Safe Fetch Wrapper
        const safeFetch = (url: string) => fetch(url, { cache: 'no-store' })
            .then(res => res.ok ? res.json() : [])
            .catch(err => {
                console.error(`Fetch failed for ${url}:`, err);
                return [];
            });

        const parallelResults = await Promise.all(fetchUrls.map(safeFetch));
        const allEventsRaw = parallelResults.flat();

        const eventMap = new Map<string, any>();
        allEventsRaw.forEach((ev: any) => {
            if (ev && ev.id && ev.title) {
                ev.volume = parseFloat(String(ev.volume || "0").replace(/,/g, ''));
                eventMap.set(ev.id, ev);
            }
        });
        const events = Array.from(eventMap.values());

        const now = Date.now();
        const filtered = events.filter((e) => {
            const titleUpper = e.title.toUpperCase();

            // 1. MUST BE A MATCH (Head-to-Head)
            const isMatchup = titleUpper.includes(" VS ") || titleUpper.includes(" @ ") || titleUpper.includes(" VS. ");

            // EXCLUDE Prop & Future keywords
            const isPropOrFuture =
                titleUpper.includes("SERIES") ||
                titleUpper.includes("CHAMPION") ||
                titleUpper.includes("WINNER") ||
                titleUpper.includes("MVP") ||
                titleUpper.includes("SEASON") ||
                titleUpper.includes(":") ||
                titleUpper.includes(" OVER ") ||
                titleUpper.includes(" UNDER ") ||
                titleUpper.includes(" TOTAL ") ||
                titleUpper.includes("RETURN") ||   // "Will OG Anunoby return"
                titleUpper.includes("SCORE") ||
                titleUpper.includes("REBOUND") ||
                titleUpper.includes("ASSIST") ||
                titleUpper.includes("POINTS");

            if (!isMatchup) return false;
            // Only allow if it's NOT a prop, OR if it's explicitly a Moneyline market
            if (isPropOrFuture && !titleUpper.includes("MONEYLINE")) return false;

            // 2. STALE DATA FILTER (Relaxes for resolved)
            if (e.startDate) {
                const startDate = new Date(e.startDate).getTime();
                // If it's more than 48 hours old and not active, kill it.
                if (startDate < now - (48 * 60 * 60 * 1000) && !e.active) return false;
            }

            return true;
        });

        // --- HELPER: GET SPORT ---
        const getSportFromTeam = (title: string): string => {
            const t = title.toUpperCase();
            const nbaTeams = ["LAKERS", "WARRIORS", "CELTICS", "KNICKS", "BUCKS", "SUNS", "MAVERICKS", "76ERS", "BULLS", "CLIPPERS", "NUGGETS", "TIMBERWOLVES", "HEAT", "ROCKETS", "PACERS", "BLAZERS", "NETS", "PELICANS", "SPURS", "JAZZ", "GRIZZLIES", "THUNDER", "HORNETS", "CAVALIERS", "MAGIC", "RAPTORS", "WIZARDS", "HAWKS", "PISTONS", "KINGS"];
            const nflTeams = ["CHIEFS", "EAGLES", "BILLS", "BEARS", "COWBOYS", "VIKINGS", "LIONS", "BRONCOS", "COMMANDERS", "49ERS", "GIANTS", "PACKERS", "RAVENS", "TEXANS", "SEAHAWKS", "BENGALS", "DOLPHINS", "JETS", "PATRIOTS", "STEELERS", "BROWNS", "COLTS", "JAGUARS", "TITANS", "RAIDERS", "CHARGERS", "RAMS", "CARDINALS", "SAINTS", "FALCONS", "BUCCANEERS", "PANTHERS"];
            const nhlTeams = ["RANGERS", "ISLANDERS", "LIGHTNING", "SENATORS", "MAPLE LEAFS", "KRAKEN", "KNIGHTS", "BRUINS", "PENGUINS", "CAPITALS", "FLYERS", "DEVILS", "HURRICANES", "PANTHERS", "RED WINGS", "STARS", "AVALANCHE", "PREDATORS", "BLUES", "WILD", "JETS", "CANUCKS", "OILERS", "FLAMES", "KINGS", "DUCKS", "SHARKS", "COYOTES", "SABRES", "CANADIENS"];
            if (nflTeams.some(k => t.includes(k))) return "NFL";
            if (nbaTeams.some(k => t.includes(k))) return "NBA";
            if (nhlTeams.some(k => t.includes(k))) return "NHL";
            return "Sports";
        };

        // Mapping and Intelligent Market Selection
        const mapped = filtered.map((e: any) => {
            const titleUpper = e.title.toUpperCase();
            const sportLabel = getSportFromTeam(titleUpper);

            // Find Primary Market (Moneyline)
            // Robust check for singular game market
            const primaryMarket = (e.markets || []).find((m: any) => {
                const q = m.question.toUpperCase();
                // Match "Team A vs Team B" or "Team A @ Team B" or "Team A vs. Team B"
                const isMatchup = q.includes(" VS ") || q.includes(" @ ") || q.includes(" VS. ");
                return isMatchup &&
                    !q.includes(":") &&
                    !q.includes("TOTAL") &&
                    !q.includes("OVER") &&
                    !q.includes("UNDER") &&
                    !q.includes("PLAYER") &&
                    !q.includes("POINT") &&
                    !q.includes("SPREAD") &&
                    !q.includes("1H ") && // Exclude 1st Half
                    !q.includes("?");     // Exclude props usually formatted as questions
            }) || (e.markets ? e.markets[0] : null);

            if (!primaryMarket) return null;

            // Parse Teams
            const parts = e.title.toUpperCase().split(/(?: VS | @ | VS\. )/i);
            const home = parts[0]?.trim() || "Home";
            const away = parts[1]?.trim() || "Away";

            const homeInfo = findTeamDetails(home);
            const awayInfo = findTeamDetails(away);

            // Extract Probability from outcomePrices (can be a JSON string from API)
            let probA = 50;
            try {
                let prices = primaryMarket.outcomePrices;
                if (typeof prices === 'string') {
                    prices = JSON.parse(prices);
                }
                if (Array.isArray(prices) && prices.length >= 2) {
                    const price = parseFloat(prices[0]);
                    if (!isNaN(price)) {
                        probA = Math.round(price * 100);
                    }
                }
            } catch (err) {
                console.error("Error parsing prices:", err);
            }
            return {
                id: e.slug || String(e.id),
                slug: e.slug || "",
                fullName: e.title,
                homeShort: home,
                awayShort: away,
                homeColor: homeInfo?.color || DEFAULT_COLOR,
                awayColor: awayInfo?.color || DEFAULT_COLOR,
                homeLogo: getLogoUrl(sportLabel, homeInfo?.logo || ""),
                awayLogo: getLogoUrl(sportLabel, awayInfo?.logo || ""),
                probA,
                probB: 100 - probA,
                volume: parseFloat(e.volume || "0"),
                totalPool: parseFloat(e.volume || "0"),
                isLive: e.active,
                image: SPORT_IMAGE_MAP[sportLabel] || DEFAULT_IMAGE,
                history: Array.from({ length: 8 }, () => 40 + Math.random() * 20),
                sportLabel,
                startDate: e.startTime || e.startDate,
                homeAbbr: homeInfo?.logo || "",
                awayAbbr: awayInfo?.logo || ""
            };
        }).filter(m => m !== null) as any[];

        const sorted = mapped.sort((a, b) => {
            // Prioritize NBA for the current user focus
            const aIsNBA = a.sportLabel === "NBA" ? 0 : 1;
            const bIsNBA = b.sportLabel === "NBA" ? 0 : 1;
            if (aIsNBA !== bIsNBA) return aIsNBA - bIsNBA;

            const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
            if (dateA === dateB) return b.volume - a.volume;
            return dateA - dateB;
        });

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
