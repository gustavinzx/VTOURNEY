import { Router } from 'express';
import { atualizarStats, buscarStats } from '../controllers/statsController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

// GET /api/stats/:usuario_id — busca stats salvas no banco
router.get('/:usuario_id', buscarStats);

// POST /api/stats/atualizar/:usuario_id — busca na API externa e salva
router.post('/atualizar/:usuario_id', autenticar, atualizarStats);

export default router;
