import { Router } from 'express';
import {
    listarInscricoes,
    inscreverTime,
    atualizarInscricao
} from '../controllers/inscricoesController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/', listarInscricoes);
router.post('/', autenticar, inscreverTime);
router.patch('/:inscricao_id', autenticar, atualizarInscricao);

export default router;