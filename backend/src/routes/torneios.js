import { Router } from 'express';
import {
    listarTorneios,
    buscarTorneio,
    criarTorneio,
    atualizarTorneio,
    deletarTorneio
} from '../controllers/torneiosController.js';

import { autenticar } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { criarTorneioSchema, atualizarTorneioSchema } from '../schemas/torneiosSchemas.js';

const router = Router();

// Rotas públicas
router.get('/', listarTorneios);
router.get('/:id', buscarTorneio);

// Rotas protegidas
router.post('/', autenticar, validate(criarTorneioSchema), criarTorneio);
router.put('/:id', autenticar, validate(atualizarTorneioSchema), atualizarTorneio);
router.delete('/:id', autenticar, deletarTorneio);

export default router;