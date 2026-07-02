import { pool } from '../config/database.js';

// Middleware to verify if user is the organizer
export async function requireOrganizer(req, res, next) {
    try {
        const torneio_id = req.params.torneio_id;
        const [torneios] = await pool.query(
            'SELECT organizador_id FROM torneios WHERE id = ?',
            [torneio_id]
        );
        if (torneios.length === 0) return res.status(404).json({ erro: 'Torneio não encontrado' });
        
        if (torneios[0].organizador_id !== req.usuario.id) {
            return res.status(403).json({ erro: 'Apenas o organizador pode acessar esta rota' });
        }
        
        next();
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao verificar organizador', detalhe: err.message });
    }
}

// PUT /api/torneios/:torneio_id/admin/inscricoes/:inscricao_id/status
export async function alterarStatusInscricao(req, res) {
    try {
        const { inscricao_id } = req.params;
        const { status } = req.body; // 'pendente', 'aprovada', 'rejeitada'
        
        if (!['pendente', 'aprovada', 'rejeitada'].includes(status)) {
            return res.status(400).json({ erro: 'Status inválido' });
        }

        await pool.query(
            'UPDATE torneio_inscricoes SET status = ? WHERE id = ?',
            [status, inscricao_id]
        );
        
        res.json({ mensagem: 'Status da inscrição atualizado' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao alterar status', detalhe: err.message });
    }
}

// PUT /api/torneios/:torneio_id/admin/partidas/:partida_id/override
export async function overridePartida(req, res) {
    try {
        const { partida_id } = req.params;
        const { time_vencedor_id, score_t1, score_t2, status } = req.body;
        
        await pool.query(
            `UPDATE partidas 
             SET vencedor_id = ?, score_time1 = ?, score_time2 = ?, status = ?
             WHERE id = ?`,
            [time_vencedor_id || null, score_t1 || 0, score_t2 || 0, status || 'finalizada', partida_id]
        );
        
        res.json({ mensagem: 'Resultado da partida forçado com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao forçar resultado', detalhe: err.message });
    }
}
