import {
    buscarMMR,
    buscarEstatisticasAgregadas
} from '../services/valorantApiService.js';

// Cache em memória como fallback quando o banco não estiver disponível.
const statsMemoryCache = new Map();

// Tenta conectar ao pool — se o banco falhar, pool fica null e usamos cache.
let pool = null;
import('../config/database.js')
    .then(db => { pool = db.pool; })
    .catch(() => {
        console.warn('[statsController] Banco de dados indisponível — usando cache em memória.');
    });

async function tryDB(fn) {
    if (!pool) return null; // DB offline → retorna null (sem lançar exceção)
    try {
        return await fn(pool);
    } catch (err) {
        console.warn('[statsController] Erro no banco:', err.message);
        return null;
    }
}

// POST /api/stats/atualizar/:usuario_id
export async function atualizarStats(req, res) {
    try {
        const { usuario_id } = req.params;

        // riot_id pode vir do body (fallback sem banco) ou buscamos no banco
        let riot_id = req.body?.riot_id || null;

        const dbUser = await tryDB(async (p) => {
            const [rows] = await p.query(
                'SELECT id, riot_id FROM usuarios WHERE id = ?',
                [usuario_id]
            );
            return rows[0] || null;
        });

        if (dbUser) {
            // banco disponível: verificamos se o usuário existe
            if (!dbUser) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }
            riot_id = dbUser.riot_id || riot_id;
        }

        if (!riot_id) {
            return res.status(400).json({ erro: 'Riot ID não encontrado. Preencha Nome#Tag no seu perfil.' });
        }

        const [nome, tag] = riot_id.split('#');
        if (!nome || !tag) {
            return res.status(400).json({ erro: 'Formato de Riot ID inválido. Use: Nome#TAG' });
        }

        console.log(`[statsController] Sincronizando stats para ${nome}#${tag}`);

        // Busca MMR e stats em paralelo
        const [mmrResult, statsResult] = await Promise.allSettled([
            buscarMMR(nome, tag),
            buscarEstatisticasAgregadas(nome, tag)
        ]);

        if (mmrResult.status === 'rejected') {
            console.error('[statsController] Falha no MMR:', mmrResult.reason?.message);
        }
        if (statsResult.status === 'rejected') {
            console.error('[statsController] Falha nas stats:', statsResult.reason?.message);
        }

        const rank = mmrResult.status === 'fulfilled'
            ? (mmrResult.value?.current_data?.currenttierpatched || 'Não ranqueado')
            : 'Não ranqueado';

        const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;

        if (!stats) {
            return res.status(502).json({ erro: 'Não foi possível buscar partidas. Perfil pode estar privado.' });
        }

        const statsObj = {
            usuario_id: parseInt(usuario_id),
            riot_id,
            rank_atual: rank,
            kd_ratio: stats.kd_ratio,
            win_rate: stats.win_rate,
            headshot_pct: stats.headshot_pct,
            partidas_analisadas: stats.partidas_analisadas,
            badges: stats.badges,
            atualizado_em: new Date().toISOString(),
        };

        // Tenta salvar no banco
        await tryDB(async (p) => {
            const [existentes] = await p.query(
                'SELECT id FROM stats_jogador WHERE usuario_id = ?',
                [usuario_id]
            );
            if (existentes.length > 0) {
                await p.query(
                    `UPDATE stats_jogador
                     SET rank_atual=?, kd_ratio=?, win_rate=?, headshot_pct=?, partidas_analisadas=?, badges=?, atualizado_em=NOW()
                     WHERE usuario_id=?`,
                    [rank, stats.kd_ratio, stats.win_rate, stats.headshot_pct, stats.partidas_analisadas, JSON.stringify(stats.badges), usuario_id]
                );
            } else {
                await p.query(
                    `INSERT INTO stats_jogador (usuario_id, rank_atual, kd_ratio, win_rate, headshot_pct, partidas_analisadas, badges)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [usuario_id, rank, stats.kd_ratio, stats.win_rate, stats.headshot_pct, stats.partidas_analisadas, JSON.stringify(stats.badges)]
                );
            }
        });

        // Sempre salva em memória como cache local
        statsMemoryCache.set(String(usuario_id), statsObj);
        console.log(`[statsController] Stats sincronizadas: rank=${rank}, kd=${stats.kd_ratio}`);

        res.json({ mensagem: 'Stats atualizadas com sucesso', stats: statsObj });
    } catch (err) {
        console.error('[statsController] Erro inesperado:', err);
        res.status(500).json({ erro: 'Erro ao sincronizar stats', detalhe: err.message });
    }
}

// GET /api/stats/:usuario_id
export async function buscarStats(req, res) {
    try {
        const { usuario_id } = req.params;

        // Tenta banco primeiro
        const dbStat = await tryDB(async (p) => {
            const [rows] = await p.query(
                `SELECT s.*, u.nome, u.riot_id
                 FROM stats_jogador s
                 JOIN usuarios u ON u.id = s.usuario_id
                 WHERE s.usuario_id = ?`,
                [usuario_id]
            );
            return rows[0] || null;
        });

        if (dbStat) {
            if (typeof dbStat.badges === 'string') {
                try { dbStat.badges = JSON.parse(dbStat.badges); } catch {}
            }
            return res.json(dbStat);
        }

        // Fallback: cache em memória
        const cached = statsMemoryCache.get(String(usuario_id));
        if (cached) return res.json(cached);

        res.status(404).json({ erro: 'Nenhuma stat encontrada. Clique em "Sincronizar Combat Record".' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar stats', detalhe: err.message });
    }
}
