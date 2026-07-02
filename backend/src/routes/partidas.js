import { Router } from 'express';
import { 
    listarPartidas, 
    gerarBracket, 
    registrarResultado, 
    detalhesPartida, 
    vetarMapa, 
    enviarMensagem 
} from '../controllers/partidasController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// Rotas dependentes do torneio_id (ex: /api/torneios/:torneio_id/partidas)
router.get('/', listarPartidas);
router.post('/gerar-bracket', autenticar, gerarBracket);

// Rotas diretas pela partida (ex: /api/partidas/:id)
router.get('/:id', autenticar, detalhesPartida);
router.patch('/:id/resultado', autenticar, registrarResultado);
router.put('/:id/resultado', autenticar, registrarResultado); // Frontend usa PUT
router.post('/:id/veto', autenticar, vetarMapa);
router.post('/:id/chat', autenticar, enviarMensagem);

export default router;
