import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'valorant_tourney',
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Teste rápido de conexão (chame isso no server.js ao subir)
export async function testarConexao() {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Conectado ao MySQL com sucesso');
        conn.release();
    } catch (err) {
        console.error('❌ Erro ao conectar no MySQL:', err.message);
    }
}
