import { Router } from 'express';
import { autenticar } from '../middleware/auth.js';
import { 
    requireOrganizer, 
    alterarStatusInscricao, 
    overridePartida 
} from '../controllers/adminTorneiosController.js';

const router = Router({ mergeParams: true });

router.use(autenticar);
router.use(requireOrganizer);

router.put('/inscricoes/:inscricao_id/status', alterarStatusInscricao);
router.put('/partidas/:partida_id/override', overridePartida);

export default router;
