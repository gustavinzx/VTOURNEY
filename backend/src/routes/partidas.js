import { Router } from 'express';
import { listarPartidas, gerarBracket, registrarResultado } from '../controllers/partidasController.js';
import { autenticar } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registrarResultadoSchema } from '../schemas/partidasSchemas.js';

const router = Router({ mergeParams: true });

router.get('/', listarPartidas);
router.post('/gerar-bracket', autenticar, gerarBracket);
router.patch('/:id/resultado', autenticar, validate(registrarResultadoSchema), registrarResultado);

export default router;
