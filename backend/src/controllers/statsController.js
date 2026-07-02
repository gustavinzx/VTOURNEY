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

async function syncUserStats(usuario_id, riot_id_fallback) {
    let riot_id = riot_id_fallback;

    const dbUser = await tryDB(async (p) => {
        const [rows] = await p.query(
            'SELECT id, riot_id FROM usuarios WHERE id = ?',
            [usuario_id]
        );
        return rows[0] || null;
    });

    if (!dbUser) {
        throw new Error('Usuário não encontrado');
    }
    riot_id = dbUser.riot_id || riot_id;

    if (!riot_id) {
        throw new Error('Riot ID não encontrado. Preencha Nome#Tag no seu perfil.');
    }

    const [nome, tag] = riot_id.split('#');
    if (!nome || !tag) {
        throw new Error('Formato de Riot ID inválido. Use: Nome#TAG');
    }

    console.log(`[statsController] Sincronizando stats para ${nome}#${tag}`);

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
        throw new Error('Não foi possível buscar partidas. Perfil pode estar privado.');
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

    statsMemoryCache.set(String(usuario_id), statsObj);
    console.log(`[statsController] Stats sincronizadas: rank=${rank}, kd=${stats.kd_ratio}`);
    return statsObj;
}

// POST /api/stats/atualizar/:usuario_id
export async function atualizarStats(req, res) {
    try {
        const { usuario_id } = req.params;

        // Segurança: só o próprio usuário ou admin pode atualizar as stats
        if (parseInt(usuario_id) !== req.usuario.id && req.usuario.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Você só pode atualizar suas próprias stats' });
        }

        const riot_id = req.body?.riot_id || null;
        
        const statsObj = await syncUserStats(usuario_id, riot_id);
        res.json({ mensagem: 'Stats atualizadas com sucesso', stats: statsObj });
    } catch (err) {
        console.error('[statsController] Erro inesperado:', err);
        res.status(err.message.includes('Não foi possível') ? 502 : 400).json({ erro: err.message });
    }
}

// GET /api/stats/:usuario_id
export async function buscarStats(req, res) {
    try {
        const { usuario_id } = req.params;

        // Tenta banco primeiro
        let dbStat = await tryDB(async (p) => {
            const [rows] = await p.query(
                `SELECT s.*, u.nome, u.riot_id
                 FROM stats_jogador s
                 JOIN usuarios u ON u.id = s.usuario_id
                 WHERE s.usuario_id = ?`,
                [usuario_id]
            );
            return rows[0] || null;
        });

        // Auto-sync se não tiver stat no banco OU se for mais velha que 1 hora
        const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
        let precisaSync = !dbStat;
        
        if (dbStat && dbStat.atualizado_em) {
            const dataAtualizacao = new Date(dbStat.atualizado_em);
            if (dataAtualizacao < umaHoraAtras) {
                precisaSync = true;
            }
        }

        if (precisaSync) {
            try {
                console.log(`[statsController] Stats desatualizadas ou inexistentes para o usuário ${usuario_id}, forçando auto-sync...`);
                await syncUserStats(usuario_id, null);
                // Busca novamente após o sync
                dbStat = await tryDB(async (p) => {
                    const [rows] = await p.query(
                        `SELECT s.*, u.nome, u.riot_id FROM stats_jogador s JOIN usuarios u ON u.id = s.usuario_id WHERE s.usuario_id = ?`,
                        [usuario_id]
                    );
                    return rows[0] || null;
                });
            } catch (syncErr) {
                console.warn(`[statsController] Auto-sync falhou para usuário ${usuario_id}:`, syncErr.message);
            }
        }

        if (dbStat) {
            if (typeof dbStat.badges === 'string') {
                try { dbStat.badges = JSON.parse(dbStat.badges); } catch {}
            }
            return res.json(dbStat);
        }

        // Fallback: cache em memória
        const cached = statsMemoryCache.get(String(usuario_id));
        if (cached) return res.json(cached);

        res.status(404).json({ erro: 'Nenhuma stat encontrada e o auto-sync falhou. Verifique se o seu Riot ID está correto no perfil.' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar stats', detalhe: err.message });
    }
}
