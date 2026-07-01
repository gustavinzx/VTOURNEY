import { getFullTrackerData } from '../services/trackerDataService.js';

export async function buscarTracker(req, res) {
    let { nome, tag } = req.params;
    
    // Decode URI components and trim spaces
    nome = decodeURIComponent(nome).trim();
    tag = decodeURIComponent(tag).trim();
    
    console.log(`[tracker] Buscando nome="${nome}", tag="${tag}"`);

    try {
        const data = await getFullTrackerData(nome, tag);
        res.json(data);
    } catch (error) {
        const status = error.response?.status;
        console.error(`[tracker] Erro (status ${status}):`, error.message);

        if (status === 429) {
            return res.status(429).json({
                error: { type: 'rate_limit', message: 'Muitas buscas em pouco tempo. Aguarde alguns segundos.' }
            });
        }
        if (status === 404) {
            return res.status(404).json({
                error: { type: 'not_found', message: 'Jogador não encontrado. Confere o Riot ID.' }
            });
        }
        if (status === 410) {
            console.error('[tracker] ❌ Endpoint depreciado na HenrikDev — atualizar URL!');
            return res.status(500).json({
                error: { type: 'unknown', message: 'Erro interno: endpoint depreciado.' }
            });
        }
        res.status(500).json({
            error: { type: 'unknown', message: 'Não foi possível carregar os dados do jogador.' }
        });
    }
}
