import { z } from 'zod';

export const criarTorneioSchema = z.object({
    body: z.object({
        nome: z.string({ required_error: 'Nome do torneio é obrigatório' }).min(5, 'Nome deve ter no mínimo 5 caracteres'),
        formato: z.enum(['eliminacao_simples', 'eliminacao_dupla', 'pontos_corridos'], { 
            errorMap: () => ({ message: 'Formato inválido. Opções válidas: eliminacao_simples, eliminacao_dupla, pontos_corridos' })
        }),
        max_times: z.number({ required_error: 'Número máximo de times é obrigatório' }).int().min(2, 'O torneio deve ter no mínimo 2 times').max(64, 'O torneio não suporta mais que 64 times'),
        data_inicio: z.string().optional().nullable().refine(val => {
            if (!val) return true;
            return !isNaN(Date.parse(val));
        }, { message: 'Data de início inválida' })
    })
});

// Schema para atualização parcial — todos os campos são opcionais
export const atualizarTorneioSchema = z.object({
    body: z.object({
        nome: z.string().min(5, 'Nome deve ter no mínimo 5 caracteres').optional(),
        descricao: z.string().optional().nullable(),
        status: z.enum(['inscricoes_abertas', 'em_andamento', 'finalizado', 'cancelado']).optional(),
        data_inicio: z.string().optional().nullable().refine(val => {
            if (!val) return true;
            return !isNaN(Date.parse(val));
        }, { message: 'Data de início inválida' }),
        data_fim: z.string().optional().nullable().refine(val => {
            if (!val) return true;
            return !isNaN(Date.parse(val));
        }, { message: 'Data de fim inválida' }),
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
