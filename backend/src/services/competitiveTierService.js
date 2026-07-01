// competitiveTierService.js
// Busca, cacheia e mapeia as patentes competitivas do Valorant usando a API
// pública valorant-api.com, igual já fazemos com os agentes em agentService.js.

import axios from 'axios';

let tiersCache = null;
let lastFetch = null;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

// O endpoint de competitivetiers retorna várias "temporadas" (episodes).
// Sempre pegamos a última (mais recente) do array, que é a atualmente em uso.
export async function fetchTiers() {
  const now = Date.now();

  if (tiersCache && lastFetch && (now - lastFetch) < CACHE_TTL) {
    return tiersCache;
  }

  try {
    const response = await axios.get('https://valorant-api.com/v1/competitivetiers');
    const seasons = response.data.data;
    const currentSeason = seasons[seasons.length - 1]; // episódio mais recente

    const map = {};
    for (const tier of currentSeason.tiers) {
      if (!tier.tierName) continue;
      map[tier.tierName.toLowerCase()] = {
        tier: tier.tier,
        name: tier.tierName,
        icon: tier.largeIcon || tier.smallIcon,
        rankTriangleUp: tier.rankTriangleUpIcon,
        rankTriangleDown: tier.rankTriangleDownIcon,
      };
    }

    tiersCache = map;
    lastFetch = now;

    console.log(`[competitiveTierService] Cache atualizado com ${Object.keys(map).length} patentes`);
    return map;
  } catch (error) {
    console.error('[competitiveTierService] Erro ao buscar patentes:', error.message);

    if (tiersCache) {
      console.warn('[competitiveTierService] Usando cache antigo como fallback');
      return tiersCache;
    }

    throw error;
  }
}

// O nome da patente que vem da HenrikDev API costuma ser tipo "Diamond 3",
// "Immortal 1", "Radiant". O mapa da valorant-api.com usa o mesmo formato de nome.
export async function getTierByName(tierName) {
  if (!tierName) return null;

  const map = await fetchTiers();
  const key = tierName.trim().toLowerCase();
  const tier = map[key];

  if (!tier) {
    console.warn(`[competitiveTierService] Patente não encontrada: "${tierName}"`);
    return null;
  }

  return tier;
}

export async function getTierById(tierId) {
  if (tierId === undefined || tierId === null) return null;

  const map = await fetchTiers();
  const byId = Object.values(map).find(t => t.tier === tierId);

  return byId || null;
}

export async function refreshCache() {
  tiersCache = null;
  lastFetch = null;
  return fetchTiers();
}
