import {
    buscarMMR,
    buscarEstatisticasAgregadas
} from '../services/valorantApiService.js';

// Cache em memória como fallback quando o banco não estiver disponível.
// Chave: usuario_id (string), Valor: stats object
const statsMemoryCache = new Map();

// Tenta importar o pool — se falhar (DB offline), continua só com cache.
let pool = null;
try {
    const db = await import('../config/database.js');
    pool = db.pool;
} catch {
    console.warn('[statsController] Banco de dados indisponível — usando cache em memória.');
}

async function dbQuery(sql, params) {
    if (!pool) throw new Error('DB_UNAVAILABLE');
    const [rows] = await pool.query(sql, params);
    return rows;
}

// POST /api/stats/atualizar/:usuario_id
// Busca o Riot ID do usuário no banco (ou localStorage via body), consulta a API e salva as stats
export async function atualizarStats(req, res) {
    try {
        const { usuario_id } = req.params;

        // Tenta pegar riot_id do banco, senão aceita do body
        let riot_id = req.body?.riot_id || null;

        try {
            const usuarios = await dbQuery(
                'SELECT id, riot_id FROM usuarios WHERE id = ?',
                [usuario_id]
            );
            if (usuarios.length === 0) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }
            riot_id = usuarios[0].riot_id || riot_id;
        } catch (dbErr) {
            if (dbErr.message !== 'DB_UNAVAILABLE') throw dbErr;
            // DB offline: usamos o riot_id do body se disponível
            console.warn('[statsController] DB offline — usando riot_id do body:', riot_id);
        }

        if (!riot_id) {
            return res.status(400).json({ erro: 'Usuário não tem Riot ID cadastrado.' });
        }

        const [nome, tag] = riot_id.split('#');
        if (!nome || !tag) {
            return res.status(400).json({ erro: 'Formato de Riot ID inválido. Use: Nome#TAG' });
        }

        // Busca MMR e stats agregadas em paralelo
        const [mmrData, statsData] = await Promise.allSettled([
            buscarMMR(nome, tag),
            buscarEstatisticasAgregadas(nome, tag)
        ]);

        const rank = mmrData.status === 'fulfilled'
            ? (mmrData.value?.current_data?.currenttierpatched || 'Não ranqueado')
            : 'Não ranqueado';

        const stats = statsData.status === 'fulfilled' ? statsData.value : null;

        if (!stats) {
            console.error('[statsController] Falha ao buscar stats:', statsData.reason?.message);
            return res.status(502).json({ erro: 'Não foi possível buscar stats de partidas. Tente novamente.' });
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

        // Tenta salvar no banco, senão usa cache em memória
        try {
            const existentes = await dbQuery(
                'SELECT id FROM stats_jogador WHERE usuario_id = ?',
                [usuario_id]
            );
            if (existentes.length > 0) {
                await dbQuery(
                    `UPDATE stats_jogador
                     SET rank_atual = ?, kd_ratio = ?, win_rate = ?, headshot_pct = ?, partidas_analisadas = ?, badges = ?, atualizado_em = NOW()
                     WHERE usuario_id = ?`,
                    [rank, stats.kd_ratio, stats.win_rate, stats.headshot_pct, stats.partidas_analisadas, JSON.stringify(stats.badges), usuario_id]
                );
            } else {
                await dbQuery(
                    `INSERT INTO stats_jogador (usuario_id, rank_atual, kd_ratio, win_rate, headshot_pct, partidas_analisadas, badges)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [usuario_id, rank, stats.kd_ratio, stats.win_rate, stats.headshot_pct, stats.partidas_analisadas, JSON.stringify(stats.badges)]
                );
            }
        } catch (dbErr) {
            if (dbErr.message !== 'DB_UNAVAILABLE') throw dbErr;
            // Fallback: guarda no cache em memória
            statsMemoryCache.set(String(usuario_id), statsObj);
            console.log(`[statsController] Stats salvas em memória para usuario_id=${usuario_id}`);
        }

        res.json({ mensagem: 'Stats atualizadas com sucesso', stats: statsObj });
    } catch (err) {
        console.error('[statsController] Erro ao atualizar stats:', err.message);
        res.status(500).json({ erro: 'Erro ao buscar stats na API do Valorant', detalhe: err.message });
    }
}

// GET /api/stats/:usuario_id
// Retorna as stats do banco ou do cache em memória
export async function buscarStats(req, res) {
    try {
        const { usuario_id } = req.params;

        // Tenta o banco primeiro
        try {
            const rows = await dbQuery(
                `SELECT s.*, u.nome, u.riot_id
                 FROM stats_jogador s
                 JOIN usuarios u ON u.id = s.usuario_id
                 WHERE s.usuario_id = ?`,
                [usuario_id]
            );

            if (rows.length > 0) {
                const stat = rows[0];
                if (typeof stat.badges === 'string') {
                    try { stat.badges = JSON.parse(stat.badges); } catch {}
                }
                return res.json(stat);
            }
        } catch (dbErr) {
            if (dbErr.message !== 'DB_UNAVAILABLE') throw dbErr;
        }

        // Fallback: cache em memória
        const cached = statsMemoryCache.get(String(usuario_id));
        if (cached) {
            return res.json(cached);
        }

        res.status(404).json({ erro: 'Stats não encontradas. Clique em "Sincronizar Combat Record" para buscar.' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar stats', detalhe: err.message });
    }
}
