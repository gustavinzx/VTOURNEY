import { pool } from '../config/database.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

/**
 * POST /api/usuarios/me/avatar
 * Recebe multipart/form-data com o campo "avatar" (arquivo de imagem).
 * Faz upload para Cloudinary com crop circular e salva a URL no banco.
 *
 * Decisão de design: o crop circular é aplicado no Cloudinary (server-side),
 * não no frontend — assim economizamos processamento no cliente e garantimos
 * qualidade consistente independente do device.
 */
export async function uploadAvatar(req, res) {
    try {
        // req.file é injetado pelo middleware multer
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhuma imagem enviada' });
        }

        const usuarioId = req.usuario.id;

        // Public ID único por usuário — garante que o overwrite substitua
        // o avatar antigo sem acumular arquivos órfãos no Cloudinary
        const publicId = `usuario_${usuarioId}`;

        const { url } = await uploadToCloudinary(req.file.buffer, publicId);

        // Persiste a URL no banco
        await pool.query(
            'UPDATE usuarios SET avatar_url = ? WHERE id = ?',
            [url, usuarioId]
        );

        res.json({
            mensagem: 'Avatar atualizado com sucesso',
            avatar_url: url,
        });
    } catch (err) {
        // Distingue erros de validação (multer) de erros de upload
        if (err.message?.includes('Formato inválido')) {
            return res.status(400).json({ erro: err.message });
        }
        if (err.message?.includes('File too large')) {
            return res.status(400).json({ erro: 'Imagem muito grande. Máximo: 2MB' });
        }
        console.error('Erro no upload de avatar:', err);
        res.status(500).json({ erro: 'Erro ao fazer upload do avatar', detalhe: err.message });
    }
}
