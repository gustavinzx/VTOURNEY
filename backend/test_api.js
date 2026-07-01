import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        const res = await axios.get('https://api.henrikdev.xyz/valorant/v3/matches/br/smth like you/gigi?size=1', {
            headers: { Authorization: process.env.VALORANT_API_KEY }
        });
        const match = res.data.data[0];
        console.log("Has match.kills array?", !!match.kills, "Length:", match.kills?.length);
        if (match.kills && match.kills.length > 0) {
            console.log("Sample kill:", JSON.stringify(match.kills[0], null, 2));
        }
        console.log("Has match.rounds array?", !!match.rounds, "Length:", match.rounds?.length);
    } catch(e) {
        console.log(e.message);
    }
}
test();
