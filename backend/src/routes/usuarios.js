import { Router } from 'express';
import {
    cadastrarUsuario,
    loginUsuario,
    buscarPerfil,
    atualizarPerfil,
    verificarRiotID
} from '../controllers/usuariosController.js';
import { autenticar } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cadastroSchema, loginSchema, updatePerfilSchema } from '../schemas/authSchemas.js';

const router = Router();

// Rotas públicas
router.post('/cadastro', validate(cadastroSchema), cadastrarUsuario);
router.post('/login', validate(loginSchema), loginUsuario);

// Rotas protegidas (precisam de token JWT)
router.get('/me', autenticar, buscarPerfil);
router.put('/me', autenticar, validate(updatePerfilSchema), atualizarPerfil);
router.post('/me/verificar-riot', autenticar, verificarRiotID);

export default router;
