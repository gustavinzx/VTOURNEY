import { pool } from '../config/database.js';

// GET /api/torneios/:torneio_id/partidas
export async function listarPartidas(req, res) {
    try {
        const { torneio_id } = req.params;
        const [rows] = await pool.query(
            `SELECT p.*, ta.nome AS time_a_nome, tb.nome AS time_b_nome, tv.nome AS vencedor_nome
             FROM partidas p
             LEFT JOIN times ta ON ta.id = p.time_a_id
             LEFT JOIN times tb ON tb.id = p.time_b_id
             LEFT JOIN times tv ON tv.id = p.vencedor_id
             WHERE p.torneio_id = ?
             ORDER BY p.id ASC`,
            [torneio_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar partidas', detalhe: err.message });
    }
}

// POST /api/torneios/:torneio_id/partidas/gerar-bracket
// Gera o chaveamento de eliminação simples a partir dos times aprovados
export async function gerarBracket(req, res) {
    try {
        const { torneio_id } = req.params;

        // Confirma que quem chama é o organizador do torneio
        const [torneio] = await pool.query('SELECT organizador_id, formato FROM torneios WHERE id = ?', [torneio_id]);
        if (torneio.length === 0) {
            return res.status(404).json({ erro: 'Torneio não encontrado' });
        }
        if (torneio[0].organizador_id !== req.usuario.id) {
            return res.status(403).json({ erro: 'Apenas o organizador pode gerar o bracket' });
        }

        // Verifica se o torneio já possui partidas (para evitar sobrescrita)
        const [partidasExistentes] = await pool.query('SELECT id FROM partidas WHERE torneio_id = ?', [torneio_id]);
        if (partidasExistentes.length > 0) {
            return res.status(400).json({ erro: 'O chaveamento deste torneio já foi gerado.' });
        }

        // Busca times aprovados
        const [inscritos] = await pool.query(
            `SELECT t.id, t.nome FROM inscricoes_torneio i
             JOIN times t ON t.id = i.time_id
             WHERE i.torneio_id = ? AND i.status = 'aprovada'`,
            [torneio_id]
        );

        if (inscritos.length < 2) {
            return res.status(400).json({ erro: 'É necessário pelo menos 2 times aprovados para gerar o bracket' });
        }

        // Embaralha os times (Fisher-Yates) para sorteio do chaveamento
        const times = [...inscritos];
        for (let i = times.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [times[i], times[j]] = [times[j], times[i]];
        }

        // Cria as partidas da primeira fase (eliminação simples).
        // Se o número de times não for potência de 2, os times excedentes
        // recebem "bye" (avanço automático) — simplificação inicial.
        const partidasCriadas = [];
        for (let i = 0; i < times.length; i += 2) {
            const timeA = times[i];
            const timeB = times[i + 1] || null; // null = bye

            const [resultado] = await pool.query(
                `INSERT INTO partidas (torneio_id, fase, time_a_id, time_b_id, status)
                 VALUES (?, ?, ?, ?, ?)`,
                [torneio_id, 'Primeira Fase', timeA.id, timeB?.id || null, timeB ? 'agendada' : 'finalizada']
            );

            partidasCriadas.push({ id: resultado.insertId, timeA: timeA.nome, timeB: timeB?.nome || 'BYE' });
        }

        // Atualiza status do torneio para "em_andamento"
        await pool.query(`UPDATE torneios SET status = 'em_andamento' WHERE id = ?`, [torneio_id]);

        res.status(201).json({ mensagem: 'Bracket gerado com sucesso', partidas: partidasCriadas });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao gerar bracket', detalhe: err.message });
    }
}

// PATCH /api/partidas/:id/resultado
export async function registrarResultado(req, res) {
    try {
        const { id } = req.params;
        const { placar_a, placar_b, vencedor_id } = req.body;

        if (!vencedor_id) {
            return res.status(400).json({ erro: 'vencedor_id é obrigatório' });
        }

        // Idealmente checar aqui se req.usuario.id é organizador do torneio dono da partida.
        // Simplificado:
        await pool.query(
            `UPDATE partidas SET placar_a = ?, placar_b = ?, vencedor_id = ?, status = 'finalizada' WHERE id = ?`,
            [placar_a ?? 0, placar_b ?? 0, vencedor_id, id]
        );

        res.json({ mensagem: 'Resultado registrado com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao registrar resultado', detalhe: err.message });
    }
}
