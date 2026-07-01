// scripts/debug-account.js - verifica a estrutura real do v2/account
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const HEADERS = { Authorization: process.env.VALORANT_API_KEY };

const r = await axios.get(
    'https://api.henrikdev.xyz/valorant/v2/account/smth%20like%20you/gigi',
    { headers: HEADERS }
);
console.log('=== v2/account CAMPOS card e region ===');
console.log('card:', JSON.stringify(r.data.data.card, null, 2));
console.log('region:', r.data.data.region);
console.log('account_level:', r.data.data.account_level);
