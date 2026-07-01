import { Router } from 'express';
import {
    listarTorneios,
    buscarTorneio,
    criarTorneio,
    atualizarTorneio,
    deletarTorneio
} from '../controllers/torneiosController.js';

import { autenticar } from '../middleware/auth.js';

const router = Router();

// Rotas públicas
router.get('/', listarTorneios);
router.get('/:id', buscarTorneio);

// Rotas protegidas
router.post('/', autenticar, criarTorneio);
router.put('/:id', autenticar, atualizarTorneio);
router.delete('/:id', autenticar, deletarTorneio);

export default router;