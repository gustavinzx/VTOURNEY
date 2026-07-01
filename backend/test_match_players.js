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
        const player = matches[0].players.all_players.find(p => p.name.toLowerCase() === 'smth like you' && p.tag.toLowerCase() === 'gigi');
        console.log('[DEBUG] Player found:', !!player);
        if (player) {
            console.log('[DEBUG] Player name:', player.name, 'tag:', player.tag);
        } else {
            console.log('[DEBUG] First player in list:', matches[0].players.all_players[0].name, matches[0].players.all_players[0].tag);
        }
    } else {
        console.log("No matches found");
    }
  } catch (error) {
    console.error(error.message);
  }
}
run();
