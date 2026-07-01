// scripts/debug-henrik.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const HEADERS = { Authorization: process.env.VALORANT_API_KEY };
const REGION = 'br'; 
const NAME = 'smth like you';
const TAG = 'gigi';

async function debugAll() {
  console.log('========== 1. CONTA ==========');
  try {
    const account = await axios.get(
      `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(NAME)}/${encodeURIComponent(TAG)}`,
      { headers: HEADERS }
    );
    console.log(JSON.stringify(account.data, null, 2));
  } catch (e) {
    console.log('ERRO:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\n========== 2. MMR / RANK ATUAL ==========');
  try {
    const mmr = await axios.get(
      `https://api.henrikdev.xyz/valorant/v2/mmr/${REGION}/${encodeURIComponent(NAME)}/${encodeURIComponent(TAG)}`,
      { headers: HEADERS }
    );
    console.log(JSON.stringify(mmr.data, null, 2));
  } catch (e) {
    console.log('ERRO:', e.response?.status, e.response?.data || e.message);
  }

  console.log('\n========== 3. HISTÓRICO DE PARTIDAS ==========');
  try {
    const matches = await axios.get(
      `https://api.henrikdev.xyz/valorant/v3/matches/${REGION}/${encodeURIComponent(NAME)}/${encodeURIComponent(TAG)}`,
      { headers: HEADERS }
    );
    console.log('Total de partidas retornadas:', matches.data.data.length);
    console.log('Primeira partida completa (Competitive):', JSON.stringify(matches.data.data.find(m => m.metadata.mode === 'Competitive'), null, 2));
    console.log('Primeira partida completa (TDM):', JSON.stringify(matches.data.data.find(m => m.metadata.mode !== 'Competitive'), null, 2));
  } catch (e) {
    console.log('ERRO:', e.response?.status, e.response?.data || e.message);
  }
}

debugAll();
