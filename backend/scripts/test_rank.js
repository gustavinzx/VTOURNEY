import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VALORANT_API_KEY;
const httpClient = axios.create({
    baseURL: 'https://api.henrikdev.xyz/valorant',
    headers: API_KEY ? { Authorization: API_KEY } : {}
});

async function fetchCurrentRank(nome, tag, regiao = 'br') {
  const url = `/v2/mmr/${regiao}/${encodeURIComponent(nome)}/${encodeURIComponent(tag)}`;
  console.log('[DEBUG fetchCurrentRank] URL chamada:', url);

  try {
    const { data } = await httpClient.get(url);
    const mmrData = data.data;
    
    console.log('[DEBUG fetchCurrentRank] Resposta crua:', JSON.stringify(mmrData, null, 2));

  } catch (error) {
    console.error('[DEBUG fetchCurrentRank] Erro completo:', error.response?.data || error.message);
  }
}

fetchCurrentRank('smth like you', 'gigi');
