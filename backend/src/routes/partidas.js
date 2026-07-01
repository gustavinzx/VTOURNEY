import { Router } from 'express';
import { listarPartidas, gerarBracket, registrarResultado } from '../controllers/partidasController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/', listarPartidas);
router.post('/gerar-bracket', autenticar, gerarBracket);
router.patch('/:id/resultado', autenticar, registrarResultado);

export default router;
