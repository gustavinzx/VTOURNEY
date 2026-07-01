import { pool } from '../config/database.js';
import {
    buscarConta,
    buscarMMR,
    buscarEstatisticasAgregadas
} from '../services/valorantApiService.js';

// POST /api/stats/atualizar/:usuario_id
// Busca o Riot ID do usuário no banco, consulta a API e salva as stats
export async function atualizarStats(req, res) {
    try {
        const { usuario_id } = req.params;

        // Busca o riot_id do usuário no banco
        const [usuarios] = await pool.query(
            'SELECT id, riot_id FROM usuarios WHERE id = ?',
            [usuario_id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        const { riot_id } = usuarios[0];

        if (!riot_id) {
            return res.status(400).json({ erro: 'Usuário não tem Riot ID cadastrado' });
        }

        // Separa nome e tag do Riot ID (ex: "Gustavin#BR1")
        const [nome, tag] = riot_id.split('#');

        if (!nome || !tag) {
            return res.status(400).json({ erro: 'Formato de Riot ID inválido. Use: Nome#TAG' });
        }

        // Busca MMR (rank) e stats agregadas em paralelo
        const [mmrData, statsData] = await Promise.allSettled([
            buscarMMR(nome, tag, 'br'),
            buscarEstatisticasAgregadas(nome, tag, 'br')
        ]);

        const rank = mmrData.status === 'fulfilled'
            ? `${mmrData.value?.current_data?.currenttierpatched || 'Não ranqueado'}`
            : 'Não ranqueado';

        const stats = statsData.status === 'fulfilled' ? statsData.value : null;

        if (!stats) {
            return res.status(502).json({ erro: 'Não foi possível buscar stats de partidas. Tente novamente.' });
        }

        // Verifica se já existe um registro de stats pra esse usuário
        const [existentes] = await pool.query(
            'SELECT id FROM stats_jogador WHERE usuario_id = ?',
            [usuario_id]
        );

        if (existentes.length > 0) {
            // Atualiza stats existentes
            await pool.query(
                `UPDATE stats_jogador
                 SET rank_atual = ?, kd_ratio = ?, win_rate = ?, headshot_pct = ?, partidas_analisadas = ?, badges = ?, atualizado_em = NOW()
                 WHERE usuario_id = ?`,
                [rank, stats.kd_ratio, stats.win_rate, stats.headshot_pct, stats.partidas_analisadas, JSON.stringify(stats.badges), usuario_id]
            );
        } else {
            // Cria novo registro
            await pool.query(
                `INSERT INTO stats_jogador (usuario_id, rank_atual, kd_ratio, win_rate, headshot_pct, partidas_analisadas, badges)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [usuario_id, rank, stats.kd_ratio, stats.win_rate, stats.headshot_pct, stats.partidas_analisadas, JSON.stringify(stats.badges)]
            );
        }

        res.json({
            mensagem: 'Stats atualizadas com sucesso',
            stats: {
                usuario_id: parseInt(usuario_id),
                riot_id,
                rank_atual: rank,
                ...stats
            }
        });
    } catch (err) {
        console.error('Erro ao atualizar stats:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar stats na API do Valorant', detalhe: err.message });
    }
}

// GET /api/stats/:usuario_id
// Retorna as stats salvas no banco (sem chamar a API externa)
export async function buscarStats(req, res) {
    try {
        const { usuario_id } = req.params;

        const [rows] = await pool.query(
            `SELECT s.*, u.nome, u.riot_id
             FROM stats_jogador s
             JOIN usuarios u ON u.id = s.usuario_id
             WHERE s.usuario_id = ?`,
            [usuario_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ erro: 'Stats não encontradas. Atualize primeiro via POST /api/stats/atualizar/:id' });
        }

        const stat = rows[0];
        if (typeof stat.badges === 'string') {
            try { stat.badges = JSON.parse(stat.badges); } catch(e){}
        }
        res.json(stat);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar stats', detalhe: err.message });
    }
}
