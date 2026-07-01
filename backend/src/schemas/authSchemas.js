import { z } from 'zod';

export const cadastroSchema = z.object({
    body: z.object({
        nome: z.string({ required_error: 'Nome é obrigatório' }).min(3, 'O nome deve ter no mínimo 3 caracteres'),
        email: z.string({ required_error: 'E-mail é obrigatório' }).email('Formato de e-mail inválido'),
        senha: z.string({ required_error: 'Senha é obrigatória' }).min(6, 'A senha deve ter no mínimo 6 caracteres'),
        riot_id: z.string().optional().nullable().refine((val) => {
            if (!val) return true;
            return val.includes('#');
        }, {
            message: 'O Riot ID deve conter a hashtag (Ex: Nome#Tag)'
        })
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string({ required_error: 'E-mail é obrigatório' }).email('Formato de e-mail inválido'),
        senha: z.string({ required_error: 'Senha é obrigatória' })
    })
});

export const updatePerfilSchema = z.object({
    body: z.object({
        nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres').optional(),
        riot_id: z.string().nullable().optional().refine((val) => {
            if (!val) return true;
            return val.includes('#');
        }, {
            message: 'O Riot ID deve conter a hashtag (Ex: Nome#Tag)'
        }),
        avatar_url: z.string().url('Avatar deve ser uma URL válida').optional().nullable(),
        banner_preset: z.number().int().min(0).max(10).optional().nullable()
    })
});
