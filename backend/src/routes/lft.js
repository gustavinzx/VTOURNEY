import { Router } from 'express';
import { listarJogadoresLFT, atualizarStatusLFT, buscarMeuLFT } from '../controllers/lftController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.get('/', listarJogadoresLFT);
router.get('/me', autenticar, buscarMeuLFT);
router.put('/me', autenticar, atualizarStatusLFT);

export default router;
