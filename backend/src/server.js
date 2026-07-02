import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testarConexao } from './config/database.js';
import torneiosRoutes from './routes/torneios.js';
import usuariosRoutes from './routes/usuarios.js';
import statsRoutes from './routes/stats.js';
import timesRoutes from './routes/times.js';
import inscricoesRoutes from './routes/inscricoes.js';
import avatarRoutes from './routes/avatar.js';
import trackerRoutes from './routes/trackerRoutes.js';
import adminRoutes from './routes/admin.js';
import partidasRoutes from './routes/partidas.js';
import discordRoutes from './routes/discord.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error('CORS: Origem não permitida'));
    },
    credentials: true,
}));
app.use(express.json());

app.use('/api/torneios', torneiosRoutes);
app.use('/api/torneios/:torneio_id/inscricoes', inscricoesRoutes);
app.use('/api/torneios/:torneio_id/partidas', partidasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/usuarios', avatarRoutes);        // POST /api/usuarios/me/avatar
app.use('/api/stats', statsRoutes);
app.use('/api/times', timesRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discord', discordRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'API Valorant Tourney rodando 🎯' });
});

app.listen(PORT, async () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    await testarConexao();
});