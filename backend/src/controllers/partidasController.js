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
export async function gerarBracket(req, res) {
    try {
        const { torneio_id } = req.params;

        const [torneio] = await pool.query('SELECT organizador_id, formato FROM torneios WHERE id = ?', [torneio_id]);
        if (torneio.length === 0) return res.status(404).json({ erro: 'Torneio não encontrado' });
        if (torneio[0].organizador_id !== req.usuario.id) return res.status(403).json({ erro: 'Apenas o organizador pode gerar o bracket' });

        const [partidasExistentes] = await pool.query('SELECT id FROM partidas WHERE torneio_id = ?', [torneio_id]);
        if (partidasExistentes.length > 0) return res.status(400).json({ erro: 'O chaveamento deste torneio já foi gerado.' });

        const [inscritos] = await pool.query(
            `SELECT t.id, t.nome FROM inscricoes_torneio i
             JOIN times t ON t.id = i.time_id
             WHERE i.torneio_id = ? AND i.status = 'aprovada'`,
            [torneio_id]
        );

        if (inscritos.length < 2) return res.status(400).json({ erro: 'É necessário pelo menos 2 times aprovados para gerar o bracket' });

        const times = [...inscritos];
        for (let i = times.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [times[i], times[j]] = [times[j], times[i]];
        }

        const partidasCriadas = [];
        for (let i = 0; i < times.length; i += 2) {
            const timeA = times[i];
            const timeB = times[i + 1] || null;

            // Define quem começa vetando o mapa (time A)
            const vezVetoId = timeB ? timeA.id : null;

            const [resultado] = await pool.query(
                `INSERT INTO partidas (torneio_id, fase, time_a_id, time_b_id, status, vez_veto_time_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [torneio_id, 'Primeira Fase', timeA.id, timeB?.id || null, timeB ? 'agendada' : 'finalizada', vezVetoId]
            );

            partidasCriadas.push({ id: resultado.insertId, timeA: timeA.nome, timeB: timeB?.nome || 'BYE' });
        }

        await pool.query(`UPDATE torneios SET status = 'em_andamento' WHERE id = ?`, [torneio_id]);
        res.status(201).json({ mensagem: 'Bracket gerado com sucesso', partidas: partidasCriadas });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao gerar bracket', detalhe: err.message });
    }
}

// PATCH ou PUT /api/partidas/:id/resultado
export async function registrarResultado(req, res) {
    try {
        const { id } = req.params;
        const { placar_a, placar_b, vencedor_id } = req.body;

        const [partidaRows] = await pool.query(
            `SELECT p.id, p.torneio_id, p.fase, p.status, t.organizador_id
             FROM partidas p
             JOIN torneios t ON t.id = p.torneio_id
             WHERE p.id = ?`,
            [id]
        );

        if (partidaRows.length === 0) return res.status(404).json({ erro: 'Partida não encontrada' });
        const partida = partidaRows[0];

        if (partida.organizador_id !== req.usuario.id) return res.status(403).json({ erro: 'Apenas o organizador do torneio pode registrar resultados' });
        if (partida.status === 'finalizada') return res.status(400).json({ erro: 'Partida já está finalizada' });

        await pool.query(
            `UPDATE partidas SET placar_a = ?, placar_b = ?, vencedor_id = ?, status = 'finalizada' WHERE id = ?`,
            [placar_a ?? 0, placar_b ?? 0, vencedor_id, id]
        );

        const [partidasFase] = await pool.query(
            `SELECT id, vencedor_id FROM partidas WHERE torneio_id = ? AND fase = ? ORDER BY id ASC`,
            [partida.torneio_id, partida.fase]
        );

        const todasFinalizadas = partidasFase.every(p => p.vencedor_id !== null);

        if (todasFinalizadas) {
            if (partidasFase.length === 1) {
                await pool.query(`UPDATE torneios SET status = 'finalizado' WHERE id = ?`, [partida.torneio_id]);
            } else {
                const currentNumber = parseInt(partida.fase.replace(/\D/g, ''));
                const nextFaseNumber = isNaN(currentNumber) ? 2 : currentNumber + 1;
                const nextFaseNome = `Fase ${nextFaseNumber}`;

                for (let i = 0; i < partidasFase.length; i += 2) {
                    const timeA = partidasFase[i];
                    const timeB = partidasFase[i + 1] || null;

                    const isBye = !timeB;
                    const v_id = isBye ? timeA.vencedor_id : null;
                    const p_status = isBye ? 'finalizada' : 'agendada';
                    const vezVetoId = isBye ? null : timeA.vencedor_id;

                    await pool.query(
                        `INSERT INTO partidas (torneio_id, fase, time_a_id, time_b_id, vencedor_id, status, vez_veto_time_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [partida.torneio_id, nextFaseNome, timeA.vencedor_id, timeB?.vencedor_id || null, v_id, p_status, vezVetoId]
                    );
                }
            }
        }

        res.json({ mensagem: 'Resultado registrado com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao registrar resultado', detalhe: err.message });
    }
}

// GET /api/partidas/:id
export async function detalhesPartida(req, res) {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT p.*, 
                ta.nome AS time_a_nome, ta.capitao_id AS time_a_capitao, ta.tag as time_a_tag,
                tb.nome AS time_b_nome, tb.capitao_id AS time_b_capitao, tb.tag as time_b_tag,
                tv.nome AS vencedor_nome,
                t.organizador_id, t.nome as torneio_nome
             FROM partidas p
             LEFT JOIN times ta ON ta.id = p.time_a_id
             LEFT JOIN times tb ON tb.id = p.time_b_id
             LEFT JOIN times tv ON tv.id = p.vencedor_id
             JOIN torneios t ON t.id = p.torneio_id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ erro: 'Partida não encontrada' });
        
        const partida = rows[0];

        // Buscar mensagens do chat
        const [mensagens] = await pool.query(
            `SELECT id, usuario_id, usuario_nome, mensagem, criado_em FROM partida_mensagens WHERE partida_id = ? ORDER BY criado_em ASC`,
            [id]
        );

        partida.mensagens = mensagens;
        res.json(partida);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar detalhes', detalhe: err.message });
    }
}

// POST /api/partidas/:id/veto
export async function vetarMapa(req, res) {
    try {
        const { id } = req.params;
        const { mapa } = req.body;
        const usuario_id = req.usuario.id;

        const [rows] = await pool.query(
            `SELECT p.*, ta.capitao_id AS cap_a, tb.capitao_id AS cap_b
             FROM partidas p
             LEFT JOIN times ta ON ta.id = p.time_a_id
             LEFT JOIN times tb ON tb.id = p.time_b_id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ erro: 'Partida não encontrada' });
        const partida = rows[0];

        if (partida.status !== 'agendada') return res.status(400).json({ erro: 'Partida não está em fase de veto.' });

        const isCapitaoA = partida.cap_a === usuario_id;
        const isCapitaoB = partida.cap_b === usuario_id;

        if (!isCapitaoA && !isCapitaoB) return res.status(403).json({ erro: 'Apenas os capitães podem vetar mapas.' });
        
        const time_id = isCapitaoA ? partida.time_a_id : partida.time_b_id;

        if (partida.vez_veto_time_id !== time_id) {
            return res.status(400).json({ erro: 'Não é o seu turno de vetar.' });
        }

        // Lógica super simplificada de "Pick". O primeiro que escolhe, define o mapa. 
        // Num cenário real seria ban-ban-ban-ban-ban-ban-pick, mas vamos simplificar para ban/pick rapido.
        // Vamos considerar que esse endpoint na verdade "ESCOLHE" o mapa.
        
        await pool.query(
            `UPDATE partidas SET mapa_jogado = ?, status_veto = 'concluido', status = 'ao_vivo' WHERE id = ?`,
            [mapa, id]
        );

        // Disparar msg no chat do sistema
        await pool.query(
            `INSERT INTO partida_mensagens (partida_id, usuario_id, usuario_nome, mensagem) VALUES (?, ?, ?, ?)`,
            [id, usuario_id, 'SISTEMA', `O mapa ${mapa} foi selecionado! A partida agora está Ao Vivo.`]
        );

        res.json({ mensagem: `Mapa ${mapa} selecionado com sucesso.` });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao registrar veto', detalhe: err.message });
    }
}

// POST /api/partidas/:id/chat
export async function enviarMensagem(req, res) {
    try {
        const { id } = req.params;
        const { mensagem } = req.body;
        const { id: usuario_id, nome: usuario_nome } = req.usuario;

        if (!mensagem || !mensagem.trim()) return res.status(400).json({ erro: 'Mensagem vazia' });

        await pool.query(
            `INSERT INTO partida_mensagens (partida_id, usuario_id, usuario_nome, mensagem) VALUES (?, ?, ?, ?)`,
            [id, usuario_id, usuario_nome, mensagem.trim()]
        );

        res.json({ mensagem: 'Enviado' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao enviar mensagem', detalhe: err.message });
    }
}
