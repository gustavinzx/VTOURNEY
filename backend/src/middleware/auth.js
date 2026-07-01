import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware que protege rotas: exige um token JWT válido no header
 * Authorization: Bearer <token>
 *
 * Se válido, injeta os dados do usuário em req.usuario
 */
export function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.usuario = payload; // { id, email }
        next();
    } catch (err) {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
}

/**
 * Middleware que protege rotas restritas a administradores
 */
export function requireAdmin(req, res, next) {
    if (req.usuario?.tipo !== 'admin') {
        return res.status(403).json({ erro: 'Acesso restrito a administradores' });
    }
    next();
}
