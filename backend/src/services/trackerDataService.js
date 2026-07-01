import axios from 'axios';
import { getAgentsBatch } from './agentService.js';
import { getTierById } from './competitiveTierService.js';
import dotenv from 'dotenv';
dotenv.config();

const httpClient = axios.create({
    baseURL: 'https://api.henrikdev.xyz/valorant',
    headers: process.env.VALORANT_API_KEY ? { Authorization: process.env.VALORANT_API_KEY } : {}
});

// Campos reais documentados a partir do debug:
// - Modo da partida: match.metadata.mode (ex: "Competitive", "Team Deathmatch")
// - Agente do jogador: player.character (ex: "Jett")
// - Resultado: extraído comparando player.team ("Red" / "Blue") com match.teams[team.toLowerCase()].has_won
// - Rank atual/RR/Variação: mmr.currenttier, mmr.currenttierpatched, mmr.ranking_in_tier, mmr.mmr_change_to_last_game
// - A região ideal pode vir do v1/account, field: account.data.data.region

export async function getFullTrackerData(name, tag) {
  let region = 'br'; // fallback
  let accountRes;

  try {
    accountRes = await httpClient.get(`/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
    region = accountRes.data.data.region || 'br';
  } catch (err) {
    console.error('[trackerDataService] Erro ao buscar account:', err.response?.data || err.message);
    throw err; // Se a conta não existe, não faz sentido continuar.
  }

  const [mmrRes, matchesRes] = await Promise.all([
    httpClient.get(`/v2/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`).catch(err => {
      console.error('[trackerDataService] Erro ao buscar MMR:', err.response?.data || err.message);
      return null;
    }),
    httpClient.get(`/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`).catch(err => {
      console.error('[trackerDataService] Erro ao buscar partidas:', err.response?.data || err.message);
      return null;
    }),
  ]);

  const rankRaw = mmrRes?.data?.data?.current_data || null;
  const tierIcon = rankRaw ? await getTierById(rankRaw.currenttier) : null;

  const rank = rankRaw ? {
    name: rankRaw.currenttierpatched,
    icon: tierIcon?.icon || null,
    rr: rankRaw.ranking_in_tier,
    rrChange: rankRaw.mmr_change_to_last_game ?? null,
  } : { name: 'Unranked', icon: null, rr: null, rrChange: null };

  const rawMatches = matchesRes?.data?.data || [];

  // Resolver TODOS os agentes de uma vez (batch)
  const allAgentNames = rawMatches.map(m => extractPlayerAgent(m, name, tag)).filter(Boolean);
  const agentsResolved = await getAgentsBatch(allAgentNames);

  const normalizedMatches = rawMatches.map(match => {
    const agentName = extractPlayerAgent(match, name, tag);
    const playerStats = extractPlayerStats(match, name, tag);
    const mode = extractGameMode(match);
    const isCompetitive = mode === 'Competitive';
    
    // Se não achou jogador na partida (ex: mismatch de nome local), retornamos null para não quebrar.
    if (!agentName) return null;

    return {
      matchId: match.metadata?.matchid,
      map: match.metadata?.map,
      mode: mode,
      isCompetitive,
      result: extractMatchResult(match, name, tag),
      agent: {
        name: agentName,
        icon: agentsResolved[agentName]?.icon || null,
      },
      stats: playerStats,
      gameStart: match.metadata?.game_start,
      gameLength: match.metadata?.game_length
    };
  }).filter(Boolean);

  const mapPerformance = calculateMapPerformance(
    normalizedMatches.filter(m => m.isCompetitive)
  );

  return {
    conta: {
      nome: accountRes.data.data.name,
      tag: accountRes.data.data.tag,
      level: accountRes.data.data.account_level,
      card_url: accountRes.data.data.card?.large || null
    },
    region,
    rank,
    matches: normalizedMatches, 
    mapPerformance,             
  };
}

function extractPlayerAgent(match, name, tag) {
  const player = findPlayer(match, name, tag);
  return player?.character || null; 
}

function extractPlayerStats(match, name, tag) {
  const player = findPlayer(match, name, tag);
  if (!player) return null;
  const stats = player.stats || {};
  return {
    kills: stats.kills ?? 0,
    deaths: stats.deaths ?? 0,
    assists: stats.assists ?? 0,
    score: stats.score ?? 0,
    kd: stats.deaths > 0 ? (stats.kills / stats.deaths) : stats.kills,
  };
}

function extractGameMode(match) {
  return match.metadata?.mode || match.metadata?.queue || null;
}

function extractMatchResult(match, name, tag) {
  const player = findPlayer(match, name, tag);
  if (!player) return 'draw';
  const playerTeam = player.team?.toLowerCase(); // 'red' or 'blue'
  if (!playerTeam || !match.teams || !match.teams[playerTeam]) return 'draw';
  
  return match.teams[playerTeam].has_won ? 'win' : 'loss';
}

function findPlayer(match, name, tag) {
  // Ignoramos case e espacos vazios que podem vir acidentalmente
  return match.players?.all_players?.find(
    p => p.name?.toLowerCase().trim() === name.toLowerCase().trim() 
      && p.tag?.toLowerCase().trim() === tag.toLowerCase().trim()
  );
}

function calculateMapPerformance(competitiveMatches) {
  const mapStats = {};
  for (const match of competitiveMatches) {
    if (!match.map) continue;
    if (!mapStats[match.map]) mapStats[match.map] = { wins: 0, losses: 0, total: 0 };
    
    mapStats[match.map].total += 1;
    if (match.result === 'win') mapStats[match.map].wins += 1;
    else if (match.result === 'loss') mapStats[match.map].losses += 1;
  }
  
  return Object.entries(mapStats).map(([map, s]) => ({
    map,
    wins: s.wins,
    losses: s.losses,
    total: s.total,
    winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
  }));
}
