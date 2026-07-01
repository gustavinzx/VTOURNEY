import { fetchAccount, fetchCurrentRank, fetchMatchHistory } from './valorantApiService.js';
import { getAgentsBatch } from './agentService.js';
import { getTierById } from './competitiveTierService.js';

// Campos reais (confirmados via debug-henrik.js):
// - Modo da partida:    match.metadata.mode     (ex: "Competitive", "Team Deathmatch")
// - Agente do jogador:  player.character         (ex: "Jett")
// - Resultado Win/Loss: match.teams[team].has_won comparado com player.team
// - Rank/RR/Variação:   v3/mmr → data.current.tier.name, .id, .rr, .last_change
// - Região:             v2/account → data.region

// ----- Cache de dados do jogador (reduz consumo de rate limit) -----
const playerDataCache = new Map();
const PLAYER_CACHE_TTL = 1000 * 60 * 3; // 3 minutos

export async function getFullTrackerData(name, tag) {
    const cacheKey = `${name.toLowerCase().trim()}#${tag.toLowerCase().trim()}`;
    const cached = playerDataCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < PLAYER_CACHE_TTL) {
        console.log(`[trackerDataService] Cache HIT para ${cacheKey}`);
        return cached.data;
    }

    console.log(`[trackerDataService] Cache MISS para ${cacheKey} — buscando na API`);

    // 1. Buscar conta para descobrir região real do jogador
    const account = await fetchAccount(name, tag);
    const region = account.region || 'br';

    // 2. Buscar rank e partidas em paralelo
    const [rankRaw, rawMatches] = await Promise.all([
        fetchCurrentRank(region, name, tag),
        fetchMatchHistory(region, name, tag, 5),
    ]);

    // 3. Resolver ícone da patente
    const tierIcon = rankRaw?.tierId != null ? await getTierById(rankRaw.tierId) : null;
    const rank = {
        name: rankRaw?.tierName || 'Unranked',
        icon: tierIcon?.icon || null,
        rr: rankRaw?.rr ?? null,
        rrChange: rankRaw?.rrChange ?? null,
    };

    // 4. Resolver todos os agentes de uma vez (batch — sem chamada repetida)
    const allAgentNames = rawMatches
        .map(m => findPlayer(m, name, tag)?.character)
        .filter(Boolean);
    const agentsResolved = await getAgentsBatch(allAgentNames);

    // 5. Normalizar partidas
    const normalizedMatches = rawMatches.map(match => {
        const player = findPlayer(match, name, tag);
        const agentName = player?.character || null;
        const mode = match.metadata?.mode || null;
        const isCompetitive = mode === 'Competitive';

        if (!player) return null;

        const playerTeam = player.team?.toLowerCase();
        const result = (playerTeam && match.teams?.[playerTeam]?.has_won) ? 'win' : 'loss';

        return {
            matchId: match.metadata?.matchid,
            map: match.metadata?.map,
            mode,
            isCompetitive,
            result,
            agent: {
                name: agentName,
                icon: agentsResolved[agentName]?.icon || null,
            },
            stats: player.stats ? {
                kills: player.stats.kills ?? 0,
                deaths: player.stats.deaths ?? 0,
                assists: player.stats.assists ?? 0,
                score: player.stats.score ?? 0,
                kd: player.stats.deaths > 0
                    ? (player.stats.kills / player.stats.deaths)
                    : player.stats.kills,
            } : null,
            gameStart: match.metadata?.game_start,
            gameLength: match.metadata?.game_length,
        };
    }).filter(Boolean);

    // 6. Map performance só com partidas competitivas
    const mapPerformance = calculateMapPerformance(
        normalizedMatches.filter(m => m.isCompetitive)
    );

    const result = {
        conta: {
            nome: account.name,
            tag: account.tag,
            level: account.account_level,
            // v2/account retorna `card` como UUID string (não objeto)
            // A URL real da imagem é construída assim:
            card_url: account.card
                ? `https://media.valorant-api.com/playercards/${account.card}/largeart.png`
                : null,
        },
        region,
        rank,
        matches: normalizedMatches,
        mapPerformance,
    };

    playerDataCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
}

function findPlayer(match, name, tag) {
    return match.players?.all_players?.find(
        p => p.name?.toLowerCase().trim() === name.toLowerCase().trim()
            && p.tag?.toLowerCase().trim() === tag.toLowerCase().trim()
    );
}

function calculateMapPerformance(competitiveMatches) {
    const mapStats = {};
    for (const match of competitiveMatches) {
        if (!match.map) continue;
        if (!mapStats[match.map]) mapStats[match.map] = { wins: 0, losses: 0 };
        if (match.result === 'win') mapStats[match.map].wins += 1;
        else mapStats[match.map].losses += 1;
    }
    return Object.entries(mapStats).map(([map, s]) => ({
        map,
        wins: s.wins,
        losses: s.losses,
        total: s.wins + s.losses,
        winRate: (s.wins + s.losses) > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0,
    }));
}
