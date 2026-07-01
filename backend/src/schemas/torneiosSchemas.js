import { z } from 'zod';

export const criarTorneioSchema = z.object({
    body: z.object({
        nome: z.string({ required_error: 'Nome do torneio é obrigatório' }).min(5, 'Nome deve ter no mínimo 5 caracteres'),
        formato: z.enum(['single_elimination', 'double_elimination', 'round_robin'], { 
            errorMap: () => ({ message: 'Formato inválido. Opções válidas: single_elimination, double_elimination, round_robin' })
        }),
        max_times: z.number({ required_error: 'Número máximo de times é obrigatório' }).int().min(2, 'O torneio deve ter no mínimo 2 times').max(64, 'O torneio não suporta mais que 64 times'),
        data_inicio: z.string().optional().nullable().refine(val => {
            if (!val) return true;
            return !isNaN(Date.parse(val));
        }, { message: 'Data de início inválida' })
    })
});

export const inscreverTimeSchema = z.object({
    body: z.object({
        time_id: z.number({ required_error: 'ID do time é obrigatório' }).int('ID do time deve ser um número inteiro')
    }),
    params: z.object({
        id: z.string({ required_error: 'ID do torneio é obrigatório' })
    })
});

export const aprovarInscricaoSchema = z.object({
    body: z.object({
        time_id: z.number({ required_error: 'ID do time é obrigatório' }).int()
    }),
    params: z.object({
        id: z.string({ required_error: 'ID do torneio é obrigatório' })
    })
});
