import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configura o SDK do Cloudinary usando variáveis de ambiente.
 * Usamos memory storage no multer para pegar o buffer e fazer
 * upload via upload_stream — mais compatível com ESM que o
 * multer-storage-cloudinary que usa CJS internamente.
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Middleware multer: armazena o arquivo em memória (Buffer).
 * fileFilter: aceita apenas jpg, png, webp.
 * limits: máx 2MB.
 */
export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter(_req, file, cb) {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato inválido. Use JPG, PNG ou WebP.'));
        }
    },
});

/**
 * Faz upload do buffer para o Cloudinary via upload_stream.
 * Aplica crop circular automático (gravity: face para centrar no rosto).
 *
 * Por que upload_stream em vez de base64?
 * upload_stream nunca toca o disco e não aumenta o tamanho do payload
 * (~33% maior no base64). É a abordagem correta para produção.
 *
 * @param {Buffer} buffer - Buffer do arquivo recebido pelo multer
 * @param {string} publicId - ID público no Cloudinary (ex: "avatar_usuario_42")
 * @returns {Promise<{url: string, public_id: string}>}
 */
export function uploadToCloudinary(buffer, publicId) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                public_id: publicId,
                folder: 'vtourney/avatars',
                overwrite: true,       // substitui avatar anterior do mesmo usuário
                // Transformação aplicada no upload:
                // w_200,h_200: redimensiona para 200×200px
                // c_fill: preenche o frame sem distorção
                // g_face: prioriza centralizar no rosto (quando detectável)
                // r_max: borda totalmente circular (r=max = círculo perfeito)
                // f_webp: converte para WebP automaticamente (menor tamanho)
                transformation: [
                    { width: 200, height: 200, crop: 'fill', gravity: 'face', radius: 'max', fetch_format: 'webp' }
                ],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, public_id: result.public_id });
            }
        );
        stream.end(buffer);
    });
}

export default cloudinary;
