import { useState, useEffect, useCallback } from 'react';

export interface LiveScore {
    id: string;
    homeScore: string;
    awayScore: string;
    clock: string;
    period: number;
    status: 'PRE' | 'LIVE' | 'FINAL';
    displayStatus: string; // e.g. "7:32 - 3rd"
}

export function useLiveScores() {
    const [scores, setScores] = useState<Map<string, LiveScore>>(new Map());
    const [loading, setLoading] = useState(true);

    const fetchScoreboard = useCallback(async () => {
        try {
            const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');
            const data = await response.json();

            const newScores = new Map<string, LiveScore>();

            if (data.events) {
                data.events.forEach((event: any) => {
                    const competition = event.competitions?.[0];
                    if (!competition) return;

                    const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
                    const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');

                    const statusType = event.status?.type?.name;
                    let status: 'PRE' | 'LIVE' | 'FINAL' = 'LIVE';
                    if (statusType === 'STATUS_SCHEDULED') status = 'PRE';
                    if (statusType === 'STATUS_FINAL') status = 'FINAL';

                    // Create a key from team names for matching (e.g. "PHI-OKC")
                    const key = `${awayTeam.team.abbreviation}-${homeTeam.team.abbreviation}`.toUpperCase();

                    newScores.set(key, {
                        id: event.id,
                        homeScore: homeTeam.score,
                        awayScore: awayTeam.score,
                        clock: event.status?.displayClock,
                        period: event.status?.period,
                        status,
                        displayStatus: event.status?.type?.detail,
                    });
                });
            }

            setScores(newScores);
            setLoading(false);
        } catch (error) {
            console.error("useLiveScores: Error fetching ESPN scoreboard", error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchScoreboard();
        const interval = setInterval(fetchScoreboard, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, [fetchScoreboard]);

    const getScoreForMarket = (homeShort: string, awayShort: string) => {
        // Try matching by abbreviations (e.g. PHI, OKC)
        const key = `${awayShort}-${homeShort}`.toUpperCase();
        return scores.get(key);
    };

    return { scores, loading, getScoreForMarket, refresh: fetchScoreboard };
}
