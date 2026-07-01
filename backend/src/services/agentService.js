// agentService.js
// Busca, cacheia e mapeia os agentes reais do Valorant usando a API pública
// valorant-api.com. Permite resolver o ícone de qualquer agente pelo nome,
// sem precisar hardcodar UUID ou nome de arquivo.

import axios from 'axios';

let agentsCache = null;
let lastFetch = null;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

export async function fetchAgents() {
  const now = Date.now();

  if (agentsCache && lastFetch && (now - lastFetch) < CACHE_TTL) {
    return agentsCache;
  }

  try {
    const response = await axios.get('https://valorant-api.com/v1/agents', {
      params: { isPlayableCharacter: true },
    });

    const agents = response.data.data;
    const map = {};

    for (const agent of agents) {
      map[agent.displayName.toLowerCase()] = {
        uuid: agent.uuid,
        name: agent.displayName,
        icon: agent.displayIcon,
        iconSmall: agent.displayIconSmall,
        fullPortrait: agent.fullPortrait,
        background: agent.background,
        role: agent.role?.displayName || null,
        color: extractAccentColor(agent),
      };
    }

    agentsCache = map;
    lastFetch = now;

    console.log(`[agentService] Cache atualizado com ${agents.length} agentes`);
    return map;
  } catch (error) {
    console.error('[agentService] Erro ao buscar agentes:', error.message);

    if (agentsCache) {
      console.warn('[agentService] Usando cache antigo como fallback');
      return agentsCache;
    }

    throw error;
  }
}

export async function getAgentByName(agentName) {
  if (!agentName) return null;

  const map = await fetchAgents();
  const key = agentName.trim().toLowerCase();
  const agent = map[key];

  if (!agent) {
    console.warn(`[agentService] Agente não encontrado: "${agentName}"`);
    return null;
  }

  return agent;
}

export async function getAgentsBatch(agentNames) {
  const map = await fetchAgents();
  const result = {};

  for (const name of agentNames) {
    if (!name) continue;
    const key = name.trim().toLowerCase();
    result[name] = map[key] || null;
  }

  return result;
}

export async function refreshCache() {
  agentsCache = null;
  lastFetch = null;
  return fetchAgents();
}

function extractAccentColor(agent) {
  const roleColors = {
    Duelist: '#ff4655',
    Initiator: '#5ce1e6',
    Controller: '#a685e2',
    Sentinel: '#7fff7f',
  };
  return roleColors[agent.role?.displayName] || '#ff4655';
}
