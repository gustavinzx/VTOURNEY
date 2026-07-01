import { Router } from 'express';
import {
    cadastrarUsuario,
    loginUsuario,
    buscarPerfil,
    atualizarPerfil
} from '../controllers/usuariosController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

// Rotas públicas
router.post('/cadastro', cadastrarUsuario);
router.post('/login', loginUsuario);

// Rotas protegidas (precisam de token JWT)
router.get('/me', autenticar, buscarPerfil);
router.put('/me', autenticar, atualizarPerfil);

export default router;
