import { z } from 'zod';

export const criarTimeSchema = z.object({
    body: z.object({
        nome: z.string({ required_error: 'Nome do time é obrigatório' }).min(3, 'Nome do time deve ter no mínimo 3 caracteres').max(50, 'Nome do time muito longo'),
        tag: z.string().max(5, 'A tag deve ter no máximo 5 caracteres').optional().nullable()
    })
});

export const adicionarMembroSchema = z.object({
    body: z.object({
        usuario_id: z.number({ required_error: 'O ID do usuário é obrigatório' }).int('ID do usuário deve ser um inteiro'),
        funcao: z.enum(['titular', 'reserva', 'capitao']).optional().default('titular')
    }),
    params: z.object({
        id: z.string({ required_error: 'ID do time é obrigatório' })
    })
});
