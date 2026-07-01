import { pool } from '../config/database.js';

// GET /api/torneios/:torneio_id/inscricoes
export async function listarInscricoes(req, res) {
    try {
        const { torneio_id } = req.params;

        const [rows] = await pool.query(
            `SELECT i.*, t.nome AS time_nome, t.tag AS time_tag
             FROM inscricoes_torneio i
             JOIN times t ON t.id = i.time_id
             WHERE i.torneio_id = ?
             ORDER BY i.inscrito_em ASC`,
            [torneio_id]
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar inscrições', detalhe: err.message });
    }
}

// POST /api/torneios/:torneio_id/inscricoes
// Capitão inscreve o time num torneio
export async function inscreverTime(req, res) {
    try {
        const { torneio_id } = req.params;
        const { time_id } = req.body;
        const usuario_id = req.usuario.id;

        if (!time_id) {
            return res.status(400).json({ erro: 'time_id é obrigatório' });
        }

        // Verifica se o torneio existe e está com inscrições abertas
        const [torneios] = await pool.query(
            'SELECT * FROM torneios WHERE id = ?',
            [torneio_id]
        );
        if (torneios.length === 0) {
            return res.status(404).json({ erro: 'Torneio não encontrado' });
        }
        if (torneios[0].status !== 'inscricoes_abertas') {
            return res.status(400).json({ erro: 'Este torneio não está com inscrições abertas' });
        }

        // Verifica se quem tá inscrevendo é o capitão do time
        const [times] = await pool.query('SELECT capitao_id FROM times WHERE id = ?', [time_id]);
        if (times.length === 0) return res.status(404).json({ erro: 'Time não encontrado' });
        if (times[0].capitao_id !== usuario_id) {
            return res.status(403).json({ erro: 'Somente o capitão pode inscrever o time' });
        }

        // Verifica limite de times
        const [inscritos] = await pool.query(
            'SELECT COUNT(*) AS total FROM inscricoes_torneio WHERE torneio_id = ? AND status = "aprovada"',
            [torneio_id]
        );
        if (inscritos[0].total >= torneios[0].max_times) {
            return res.status(400).json({ erro: 'Torneio já atingiu o limite de times' });
        }

        await pool.query(
            'INSERT INTO inscricoes_torneio (torneio_id, time_id) VALUES (?, ?)',
            [torneio_id, time_id]
        );

        res.status(201).json({ mensagem: 'Inscrição realizada com sucesso! Aguardando aprovação do organizador.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Time já está inscrito neste torneio' });
        }
        res.status(500).json({ erro: 'Erro ao inscrever time', detalhe: err.message });
    }
}

// PATCH /api/torneios/:torneio_id/inscricoes/:inscricao_id
// Organizador aprova ou rejeita inscrição
export async function atualizarInscricao(req, res) {
    try {
        const { torneio_id, inscricao_id } = req.params;
        const { status } = req.body; // 'aprovada' ou 'rejeitada'
        const usuario_id = req.usuario.id;

        if (!['aprovada', 'rejeitada'].includes(status)) {
            return res.status(400).json({ erro: 'Status deve ser "aprovada" ou "rejeitada"' });
        }

        // Verifica se quem tá atualizando é o organizador do torneio
        const [torneios] = await pool.query(
            'SELECT organizador_id FROM torneios WHERE id = ?',
            [torneio_id]
        );
        if (torneios.length === 0) return res.status(404).json({ erro: 'Torneio não encontrado' });
        if (torneios[0].organizador_id !== usuario_id) {
            return res.status(403).json({ erro: 'Somente o organizador pode aprovar/rejeitar inscrições' });
        }

        const [resultado] = await pool.query(
            'UPDATE inscricoes_torneio SET status = ? WHERE id = ? AND torneio_id = ?',
            [status, inscricao_id, torneio_id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Inscrição não encontrada' });
        }

        res.json({ mensagem: `Inscrição ${status} com sucesso` });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar inscrição', detalhe: err.message });
    }
}
