import { Router } from 'express';
import {
    listarTorneios,
    buscarTorneio,
    criarTorneio,
    atualizarTorneio,
    deletarTorneio
} from '../controllers/torneiosController.js';

const router = Router();

router.get('/', listarTorneios);
router.get('/:id', buscarTorneio);
router.post('/', criarTorneio);
router.put('/:id', atualizarTorneio);
router.delete('/:id', deletarTorneio);

export default router;