import { Router } from 'express';
import {
    listarTimes,
    buscarTime,
    criarTime,
    adicionarMembro,
    deletarTime,
    entrarTime,
    removerMembro
} from '../controllers/timesController.js';
import { autenticar } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { criarTimeSchema, adicionarMembroSchema } from '../schemas/timesSchemas.js';

const router = Router();

router.get('/', listarTimes);
router.get('/:id', buscarTime);
router.post('/', autenticar, validate(criarTimeSchema), criarTime);
router.post('/:id/membros', autenticar, validate(adicionarMembroSchema), adicionarMembro);
router.post('/convite/:token', autenticar, entrarTime);
router.delete('/:id/membros/:userId', autenticar, removerMembro);
router.delete('/:id', autenticar, deletarTime);

export default router;