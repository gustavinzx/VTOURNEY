import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.VALORANT_API_BASE_URL || 'https://api.henrikdev.xyz/valorant';
const API_KEY = process.env.VALORANT_API_KEY;

const httpClient = axios.create({
    baseURL: BASE_URL,
    headers: API_KEY ? { Authorization: API_KEY } : {}
});

/**
 * Busca dados de conta a partir do Riot ID (nome#tag)
 * Doc: https://docs.henrikdev.xyz
 */
export async function buscarConta(nome, tag, regiao = 'br') {
    const { data } = await httpClient.get(`/v1/account/${nome}/${tag}`);
    return data.data;
}

/**
 * Busca o MMR (rank) atual do jogador (deprecated format, used by stats sync)
 */
export async function buscarMMR(nome, tag, regiao = 'br') {
    const { data } = await httpClient.get(`/v2/mmr/${regiao}/${nome}/${tag}`);
    return data.data;
}

/**
 * Busca o MMR formatado corretamente para o Tracker e perfis
 */
export async function fetchCurrentRank(nome, tag, regiao = 'br') {
  const url = `/v2/mmr/${regiao}/${encodeURIComponent(nome)}/${encodeURIComponent(tag)}`;
  console.log('[DEBUG fetchCurrentRank] URL chamada:', url);

  try {
    const { data } = await httpClient.get(url);
    const mmrData = data.data;
    
    console.log('[DEBUG fetchCurrentRank] Resposta crua:', JSON.stringify(mmrData, null, 2));

    return {
      currentTierId: mmrData.currenttier,
      currentTierName: mmrData.currenttierpatched,
      rr: mmrData.ranking_in_tier,
      rrChange: mmrData.mmr_change_to_last_game ?? null,
    };
  } catch (error) {
    console.error('[DEBUG fetchCurrentRank] Erro completo:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Busca histórico recente de partidas e calcula estatísticas agregadas
 * (KD, winrate, headshot %) para salvar em stats_jogador
 */
export async function buscarEstatisticasAgregadas(nome, tag, regiao = 'br') {
    const { data } = await httpClient.get(`/v3/matches/${regiao}/${nome}/${tag}`);
    const partidas = data.data || [];

    if (partidas.length === 0) {
        return null;
    }

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
        const venceu = jogador.team === timeVencedor;
        if (venceu) vitorias++;

        // --- Calculate Badges ---
        // 1. Top Fragger: Check if player had highest kills in the match
        const maxKillsMatch = Math.max(...(partida.players?.all_players?.map(p => p.stats.kills) || [0]));
        if (jogador.stats.kills >= maxKillsMatch && maxKillsMatch > 0) {
            badges.top_fragger = true;
        }

        // 2. Flawless: Win match with 0 deaths or score > 7000 with very low deaths
        if (venceu && jogador.stats.deaths <= 2 && jogador.stats.kills > 10) {
            badges.flawless = true;
        }

        // 3. Clutch Master: Heuristic based on high assists + wins or high score + low kills
        if (jogador.stats.score > 6000 || jogador.stats.assists > 10) {
            badges.clutch_master = true;
        }

        // Parse kills array for Ace and First Blood
        if (partida.kills && partida.kills.length > 0) {
            let roundKills = {};
            let roundFirstKills = {};
            
            for (const k of partida.kills) {
                // Track Ace
                if (k.killer_puuid === jogador.puuid || k.killer_display_name.toLowerCase().startsWith(nome.toLowerCase())) {
                    roundKills[k.round] = (roundKills[k.round] || 0) + 1;
                    if (roundKills[k.round] >= 5) badges.ace = true;
                }

                // Track First Bloods
                if (!roundFirstKills[k.round] || k.kill_time_in_round < roundFirstKills[k.round].kill_time_in_round) {
                    roundFirstKills[k.round] = k;
                }
            }

            // Check if player got any first bloods
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

/**
 * Busca o histórico de partidas cru para o Tracker Público
 */
export async function buscarPartidas(nome, tag, regiao = 'br', limite = 5) {
    const { data } = await httpClient.get(`/v3/matches/${regiao}/${encodeURIComponent(nome)}/${encodeURIComponent(tag)}?size=${limite}`);
    return data.data || [];
}
