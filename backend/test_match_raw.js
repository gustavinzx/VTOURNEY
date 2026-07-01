import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VALORANT_API_KEY;
const httpClient = axios.create({
    baseURL: 'https://api.henrikdev.xyz/valorant',
    headers: API_KEY ? { Authorization: API_KEY } : {}
});

async function run() {
  try {
    const { data } = await httpClient.get(`/v3/matches/br/smth like you/gigi`);
    const matches = data.data;
    if (matches && matches.length > 0) {
        console.log('[DEBUG] Estrutura de uma partida crua:');
        console.log(JSON.stringify({
            metadata: matches[0].metadata,
            teams: matches[0].teams
        }, null, 2));
        console.log('[DEBUG] Modes from matches:', matches.map(m => m.metadata.mode));
    } else {
        console.log("No matches found");
    }
  } catch (error) {
    console.error(error.message);
  }
}
run();
