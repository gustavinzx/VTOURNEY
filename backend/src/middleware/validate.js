import { ZodError } from 'zod';

export const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Mapeia os erros do Zod para um formato amigável
                const erroMessages = error.errors.map(err => err.message);
                return res.status(400).json({
                    erro: 'Erro de Validação',
                    detalhes: erroMessages,
                });
            }
            return res.status(500).json({ erro: 'Erro interno de validação' });
        }
    };
};
