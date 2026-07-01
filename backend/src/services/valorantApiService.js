import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VALORANT_API_KEY;
const BASE_URL = 'https://api.henrikdev.xyz/valorant';
const HEADERS = API_KEY ? { Authorization: API_KEY } : {};
const PLATFORM = 'pc'; // suportar console no futuro se necessário

// ----- Logging de erros da HenrikDev -----
export function logHenrikError(error, context) {
    const status = error.response?.status;
    if (status === 410) {
        console.error(`[HenrikDev] ❌ ENDPOINT DEPRECIADO em "${context}" — atualizar a URL para a versão atual.`);
    } else if (status === 429) {
        const remaining = error.response.headers['x-ratelimit-remaining'];
        console.warn(`[HenrikDev] ⚠️  RATE LIMIT em "${context}". Remaining: ${remaining ?? '?'}`);
    } else if (status === 403) {
        console.error(`[HenrikDev] 🔒 Bloqueado (403) em "${context}" — possível manutenção da Riot ou bloqueio anti-bot.`);
    } else if (status === 503) {
        console.error(`[HenrikDev] 💀 Riot API fora do ar (503) em "${context}".`);
    } else if (status === 404) {
        console.warn(`[HenrikDev] 🔍 Não encontrado (404) em "${context}".`);
    } else {
        console.error(`[HenrikDev] Erro em "${context}":`, status, error.response?.data || error.message);
    }
}

// ----- v2/account — retorna região, puuid, card -----
export async function fetchAccount(name, tag) {
    const url = `${BASE_URL}/v2/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    try {
        const res = await axios.get(url, { headers: HEADERS });
        return res.data.data; // { puuid, region, account_level, name, tag, card, updated_at }
    } catch (error) {
        logHenrikError(error, 'fetchAccount');
        throw error;
    }
}

// ----- v3/mmr — endpoint atual (v1 e v2 depreciados 410) -----
export async function fetchCurrentRank(region, name, tag) {
    const url = `${BASE_URL}/v3/mmr/${region}/${PLATFORM}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
    console.log(`[valorantApiService] Buscando rank: ${url}`);
    try {
        const res = await axios.get(url, { headers: HEADERS });
        const data = res.data.data;
        return {
            tierName: data.current?.tier?.name || 'Unranked',
            tierId: data.current?.tier?.id ?? null,
            rr: data.current?.rr ?? null,
            rrChange: data.current?.last_change ?? null,
        };
    } catch (error) {
        logHenrikError(error, 'fetchCurrentRank');
        return null; // rank indisponível não derruba a página
    }
}

// ----- v3/matches — estrutura já validada -----
export async function fetchMatchHistory(region, name, tag, size = 5) {
    const url = `${BASE_URL}/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=${size}`;
    try {
        const res = await axios.get(url, { headers: HEADERS });
        return res.data.data || [];
    } catch (error) {
        logHenrikError(error, 'fetchMatchHistory');
        return [];
    }
}

// ----- Funções legadas compatíveis com statsController e outros controladores -----

export async function buscarConta(nome, tag) {
    return fetchAccount(nome, tag);
}

// buscarMMR: mantida para não quebrar statsController.js
// Internamente usa fetchCurrentRank (v3/mmr, não depreciado)
export async function buscarMMR(nome, tag, regiao = 'br') {
    // Precisamos da região real do jogador para chamar o v3/mmr
    let region = regiao;
    try {
        const account = await fetchAccount(nome, tag);
        region = account.region || regiao;
    } catch {
        // fallback para a região passada
    }
    const rank = await fetchCurrentRank(region, nome, tag);
    // Retorna no formato que statsController espera: { current_data: { currenttierpatched } }
    return rank ? {
        current_data: {
            currenttierpatched: rank.tierName,
            currenttier: rank.tierId,
            ranking_in_tier: rank.rr,
            mmr_change_to_last_game: rank.rrChange,
        }
    } : null;
}

export async function buscarEstatisticasAgregadas(nome, tag, regiao = 'br') {
    const partidas = await fetchMatchHistory(regiao, nome, tag, 10);

    if (partidas.length === 0) return null;

    let totalKills = 0, totalDeaths = 0, totalHeadshots = 0, totalShots = 0, vitorias = 0;
    const badges = {
        first_blood: false,
        clutch_master: false,
        flawless: false,
        ace: false,
        top_fragger: false
    };

    for (const partida of partidas) {
        const jogador = partida.players?.all_players?.find(
            p => p.name.toLowerCase() === nome.toLowerCase() && p.tag.toLowerCase() === tag.toLowerCase()
        );
        if (!jogador) continue;

        totalKills += jogador.stats.kills;
        totalDeaths += jogador.stats.deaths;
        totalHeadshots += jogador.stats.headshots;
        totalShots += jogador.stats.headshots + jogador.stats.bodyshots + jogador.stats.legshots;

        const timeVencedor = partida.teams?.red?.has_won ? 'Red' : 'Blue';
        if (jogador.team === timeVencedor) vitorias++;

        const maxKillsMatch = Math.max(...(partida.players?.all_players?.map(p => p.stats.kills) || [0]));
        if (jogador.stats.kills >= maxKillsMatch && maxKillsMatch > 0) badges.top_fragger = true;
        if (jogador.team === timeVencedor && jogador.stats.deaths <= 2 && jogador.stats.kills > 10) badges.flawless = true;
        if (jogador.stats.score > 6000 || jogador.stats.assists > 10) badges.clutch_master = true;

        if (partida.kills?.length > 0) {
            let roundKills = {};
            let roundFirstKills = {};
            for (const k of partida.kills) {
                if (k.killer_puuid === jogador.puuid || k.killer_display_name.toLowerCase().startsWith(nome.toLowerCase())) {
                    roundKills[k.round] = (roundKills[k.round] || 0) + 1;
                    if (roundKills[k.round] >= 5) badges.ace = true;
                }
                if (!roundFirstKills[k.round] || k.kill_time_in_round < roundFirstKills[k.round].kill_time_in_round) {
                    roundFirstKills[k.round] = k;
                }
            }
            for (const r in roundFirstKills) {
                if (roundFirstKills[r].killer_display_name.toLowerCase().startsWith(nome.toLowerCase())) {
                    badges.first_blood = true;
                }
            }
        }
    }

    return {
        kd_ratio: totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills,
        win_rate: ((vitorias / partidas.length) * 100).toFixed(2),
        headshot_pct: totalShots > 0 ? ((totalHeadshots / totalShots) * 100).toFixed(2) : 0,
        partidas_analisadas: partidas.length,
        badges
    };
}
