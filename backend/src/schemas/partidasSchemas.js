import { z } from 'zod';

export const registrarResultadoSchema = z.object({
    body: z.object({
        vencedor_id: z.number({ required_error: 'O ID do vencedor é obrigatório' }).int(),
        placar_a: z.number({ required_error: 'Placar do Time A é obrigatório' }).int().min(0),
        placar_b: z.number({ required_error: 'Placar do Time B é obrigatório' }).int().min(0)
    }),
    params: z.object({
        id: z.string({ required_error: 'ID da partida é obrigatório' })
    })
});
