import { Router } from 'express';
import { autenticar } from '../middleware/auth.js';
import { uploadMiddleware } from '../config/cloudinary.js';
import { uploadAvatar } from '../controllers/avatarController.js';

const router = Router();

/**
 * POST /api/usuarios/me/avatar
 * Ordem dos middlewares:
 * 1. autenticar — verifica JWT, injeta req.usuario
 * 2. uploadMiddleware.single('avatar') — parseia o multipart/form-data,
 *    valida tipo e tamanho, injeta req.file com o buffer
 * 3. uploadAvatar — faz o upload para Cloudinary e persiste no banco
 */
router.post('/me/avatar', autenticar, uploadMiddleware.single('avatar'), uploadAvatar);

export default router;
