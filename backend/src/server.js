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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/torneios', torneiosRoutes);
app.use('/api/torneios/:torneio_id/inscricoes', inscricoesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/usuarios', avatarRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/times', timesRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({ status: 'API Valorant Tourney rodando 🎯' });
});

app.listen(PORT, async () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    await testarConexao();
});