import { pool } from '../config/database.js';
import crypto from 'crypto';

// GET /api/times
export async function listarTimes(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT t.*, u.nome AS capitao_nome,
                    COUNT(m.id) AS total_membros
             FROM times t
             JOIN usuarios u ON u.id = t.capitao_id
             LEFT JOIN membros_time m ON m.time_id = t.id
             GROUP BY t.id
             ORDER BY t.criado_em DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar times', detalhe: err.message });
    }
}

// GET /api/times/:id
export async function buscarTime(req, res) {
    try {
        const { id } = req.params;

        const [times] = await pool.query(
            `SELECT t.*, u.nome AS capitao_nome
             FROM times t
             JOIN usuarios u ON u.id = t.capitao_id
             WHERE t.id = ?`,
            [id]
        );

        if (times.length === 0) {
            return res.status(404).json({ erro: 'Time não encontrado' });
        }

        // Se o usuário que pede não é o capitão, esconde o convite_token
        if (!req.usuario || req.usuario.id !== times[0].capitao_id) {
            delete times[0].convite_token;
        }

        // Busca membros do time
        const [membros] = await pool.query(
            `SELECT m.funcao, u.id, u.nome, u.riot_id, u.avatar_url
             FROM membros_time m
             JOIN usuarios u ON u.id = m.usuario_id
             WHERE m.time_id = ?`,
            [id]
        );

        res.json({ ...times[0], membros });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar time', detalhe: err.message });
    }
}

// POST /api/times
// Cria um time e já adiciona o criador como capitão e membro titular
export async function criarTime(req, res) {
    try {
        const { nome, tag } = req.body;
        const capitao_id = req.usuario.id; // vem do middleware JWT



        const token = crypto.randomBytes(16).toString('hex');

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [resultado] = await conn.query(
                'INSERT INTO times (nome, tag, capitao_id, convite_token) VALUES (?, ?, ?, ?)',
                [nome, tag || null, capitao_id, token]
            );

            const time_id = resultado.insertId;

            // Adiciona o criador como membro titular automaticamente
            await conn.query(
                'INSERT INTO membros_time (time_id, usuario_id, funcao) VALUES (?, ?, ?)',
                [time_id, capitao_id, 'titular']
            );

            await conn.commit();
            res.status(201).json({ id: time_id, mensagem: 'Time criado com sucesso', convite_token: token });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao criar time', detalhe: err.message });
    }
}

// POST /api/times/:id/membros
// Adiciona um membro ao time (só o capitão pode fazer isso)
export async function adicionarMembro(req, res) {
    try {
        const { id: time_id } = req.params;
        const { usuario_id, funcao } = req.body;
        const capitao_id = req.usuario.id;

        // Verifica se quem tá adicionando é o capitão
        const [times] = await pool.query('SELECT capitao_id FROM times WHERE id = ?', [time_id]);
        if (times.length === 0) return res.status(404).json({ erro: 'Time não encontrado' });
        if (times[0].capitao_id !== capitao_id) {
            return res.status(403).json({ erro: 'Somente o capitão pode adicionar membros' });
        }

        await pool.query(
            'INSERT INTO membros_time (time_id, usuario_id, funcao) VALUES (?, ?, ?)',
            [time_id, usuario_id, funcao || 'titular']
        );

        res.status(201).json({ mensagem: 'Membro adicionado com sucesso' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Usuário já é membro deste time' });
        }
        res.status(500).json({ erro: 'Erro ao adicionar membro', detalhe: err.message });
    }
}

// DELETE /api/times/:id
export async function deletarTime(req, res) {
    try {
        const { id } = req.params;
        const capitao_id = req.usuario.id;

        const [times] = await pool.query('SELECT capitao_id FROM times WHERE id = ?', [id]);
        if (times.length === 0) return res.status(404).json({ erro: 'Time não encontrado' });
        if (times[0].capitao_id !== capitao_id) {
            return res.status(403).json({ erro: 'Somente o capitão pode deletar o time' });
        }

        await pool.query('DELETE FROM times WHERE id = ?', [id]);
        res.json({ mensagem: 'Time deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar time', detalhe: err.message });
    }
}

// POST /api/times/convite/:token
export async function entrarTime(req, res) {
    try {
        const { token } = req.params;
        const usuario_id = req.usuario.id;

        const [times] = await pool.query('SELECT id, nome FROM times WHERE convite_token = ?', [token]);
        if (times.length === 0) return res.status(404).json({ erro: 'Convite inválido ou expirado' });

        const time = times[0];

        // Verifica se já está no time
        const [existente] = await pool.query('SELECT id FROM membros_time WHERE time_id = ? AND usuario_id = ?', [time.id, usuario_id]);
        if (existente.length > 0) return res.status(400).json({ erro: 'Você já está neste time' });

        // Limite de 7 membros
        const [contagem] = await pool.query('SELECT COUNT(*) as qtd FROM membros_time WHERE time_id = ?', [time.id]);
        if (contagem[0].qtd >= 7) return res.status(400).json({ erro: 'O time já está lotado (máx 7 membros)' });

        await pool.query('INSERT INTO membros_time (time_id, usuario_id, funcao) VALUES (?, ?, ?)', [time.id, usuario_id, 'titular']);

        res.json({ mensagem: `Você entrou no time ${time.nome} com sucesso!`, time_id: time.id });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao entrar no time', detalhe: err.message });
    }
}

// DELETE /api/times/:id/membros/:userId
export async function removerMembro(req, res) {
    try {
        const timeId = req.params.id;
        const targetUserId = req.params.userId;
        const currentUserId = req.usuario.id;

        const [times] = await pool.query('SELECT capitao_id FROM times WHERE id = ?', [timeId]);
        if (times.length === 0) return res.status(404).json({ erro: 'Time não encontrado' });

        const isCapitao = times[0].capitao_id === currentUserId;
        const isSelf = parseInt(targetUserId) === currentUserId;

        if (!isCapitao && !isSelf) {
            return res.status(403).json({ erro: 'Apenas o capitão pode remover outros membros' });
        }

        if (isSelf && isCapitao) {
            return res.status(400).json({ erro: 'O capitão não pode sair do time. Você deve deletar o time inteiro.' });
        }

        await pool.query('DELETE FROM membros_time WHERE time_id = ? AND usuario_id = ?', [timeId, targetUserId]);
        res.json({ mensagem: 'Membro removido com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao remover membro', detalhe: err.message });
    }
}
