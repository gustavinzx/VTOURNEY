import { pool } from '../config/database.js';

// GET /api/lft
// Lista todos os jogadores com LFT ativado
export async function listarJogadoresLFT(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT id, nome, riot_id, discord_id, lft_role, lft_mensagem
             FROM usuarios
             WHERE lft_status = TRUE
             ORDER BY criado_em DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar jogadores LFT', detalhe: err.message });
    }
}

// PUT /api/lft/me
// Atualiza o status LFT do próprio usuário
export async function atualizarStatusLFT(req, res) {
    try {
        const { status, role, mensagem } = req.body;
        const usuario_id = req.usuario.id;

        await pool.query(
            `UPDATE usuarios
             SET lft_status = ?, lft_role = ?, lft_mensagem = ?
             WHERE id = ?`,
            [status ? 1 : 0, role || null, mensagem || null, usuario_id]
        );

        res.json({ mensagem: 'Status de LFT atualizado com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar status LFT', detalhe: err.message });
    }
}

// GET /api/lft/me
// Pega o status LFT atual do usuário
export async function buscarMeuLFT(req, res) {
    try {
        const usuario_id = req.usuario.id;
        const [rows] = await pool.query(
            `SELECT lft_status, lft_role, lft_mensagem FROM usuarios WHERE id = ?`,
            [usuario_id]
        );

        if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar status LFT', detalhe: err.message });
    }
}
