import { getFullTrackerData } from '../services/trackerDataService.js';

export async function buscarTracker(req, res) {
    let { nome, tag } = req.params;
    
    // Decode URI components and trim spaces because Next.js slug might pass %20 for spaces
    // and the user might have accidentally typed trailing spaces.
    nome = decodeURIComponent(nome).trim();
    tag = decodeURIComponent(tag).trim();
    
    console.log(`[DEBUG buscarTracker] Fetching for nome="${nome}", tag="${tag}"`);

    try {
        const data = await getFullTrackerData(nome, tag);
        res.json(data);
    } catch (error) {
        console.error('[tracker route] Erro:', error.message);
        res.status(500).json({ error: 'Não foi possível carregar os dados do jogador.' });
    }
}
