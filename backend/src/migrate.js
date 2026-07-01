import { pool } from './config/database.js';

async function migrate() {
    try {
        await pool.query("ALTER TABLE usuarios ADD COLUMN banner_preset TINYINT DEFAULT 0;");
        console.log("Migration successful");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists");
        } else {
            console.error(e);
        }
    } finally {
        process.exit(0);
    }
}
migrate();
