import { pool } from './src/config/database.js';

async function main() {
    try {
        await pool.query('ALTER TABLE stats_jogador ADD COLUMN badges JSON;');
        console.log("Column added successfully!");
    } catch(e) {
        if(e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.log("Error:", e.message);
        }
    } finally {
        process.exit();
    }
}
main();
