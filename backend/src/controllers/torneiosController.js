import { pool } from '../config/database.js';

// GET /api/torneios?status=inscricoes_abertas&q=copa&sort=recentes|vagas
export async function listarTorneios(req, res) {
    try {
        const { status, q, sort } = req.query;

        // Cláusulas WHERE dinâmicas com array de condições.
        // Por que este padrão em vez de string concatenation?
        // Evita SQL injection ao usar placeholders (?) e mantém o código
        // legível quando múltiplos filtros são combinados.
        const conditions = [];
        const params = [];

        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }

        if (q) {
            // LIKE com wildcard: busca por nome parcial, case-insensitive (MySQL default)
            conditions.push('t.nome LIKE ?');
            params.push(`%${q}%`);
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // Ordenação:
        // - "vagas": menos inscritos aprovados primeiro (mais vagas disponíveis)
        //   usa subquery correlacionada — mais legível que JOIN + GROUP BY aqui
        // - padrão: mais recentes primeiro
        const orderClause = sort === 'vagas'
            ? `ORDER BY (t.max_times - (
                SELECT COUNT(*) FROM inscricoes_torneio i
                WHERE i.torneio_id = t.id AND i.status = 'aprovada'
               )) DESC, t.criado_em DESC`
            : 'ORDER BY t.criado_em DESC';

        const [rows] = await pool.query(
            `SELECT t.*, u.nome AS organizador_nome,
                    (SELECT COUNT(*) FROM inscricoes_torneio i
                     WHERE i.torneio_id = t.id AND i.status = 'aprovada') AS times_aprovados
             FROM torneios t
             JOIN usuarios u ON u.id = t.organizador_id
             ${whereClause}
             ${orderClause}`,
            params
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar torneios', detalhe: err.message });
    }
}


// GET /api/torneios/:id
export async function buscarTorneio(req, res) {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM torneios WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ erro: 'Torneio não encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar torneio', detalhe: err.message });
    }
}

// POST /api/torneios
export async function criarTorneio(req, res) {
    try {
        const { nome, descricao, formato, max_times, organizador_id, data_inicio } = req.body;

        if (!nome || !organizador_id) {
            return res.status(400).json({ erro: 'Nome e organizador_id são obrigatórios' });
        }

        const [resultado] = await pool.query(
            `INSERT INTO torneios (nome, descricao, formato, max_times, organizador_id, data_inicio)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, descricao || null, formato || 'eliminacao_simples', max_times || 8, organizador_id, data_inicio || null]
        );

        res.status(201).json({ id: resultado.insertId, mensagem: 'Torneio criado com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao criar torneio', detalhe: err.message });
    }
}

// PUT /api/torneios/:id
export async function atualizarTorneio(req, res) {
    try {
        const { id } = req.params;
        const { nome, descricao, status, data_inicio, data_fim } = req.body;

        const [resultado] = await pool.query(
            `UPDATE torneios
             SET nome = COALESCE(?, nome),
                 descricao = COALESCE(?, descricao),
                 status = COALESCE(?, status),
                 data_inicio = COALESCE(?, data_inicio),
                 data_fim = COALESCE(?, data_fim)
             WHERE id = ?`,
            [nome, descricao, status, data_inicio, data_fim, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Torneio não encontrado' });
        }
        res.json({ mensagem: 'Torneio atualizado com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar torneio', detalhe: err.message });
    }
}

// DELETE /api/torneios/:id
export async function deletarTorneio(req, res) {
    try {
        const { id } = req.params;
        const [resultado] = await pool.query('DELETE FROM torneios WHERE id = ?', [id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: 'Torneio não encontrado' });
        }
        res.json({ mensagem: 'Torneio removido com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar torneio', detalhe: err.message });
    }
}
