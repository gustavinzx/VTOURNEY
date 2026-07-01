'use client';
import { useEffect, useState } from 'react';
import { AnimatedList, AnimatedListItem } from '@/components/ui/AnimatedList';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface TrackerData {
    conta: {
        nome: string;
        tag: string;
        level: number;
        card_url: string;
    };
    rank: {
        name: string;
        icon: string | null;
        rr: number | null;
        rrChange: number | null;
    };
    matches: {
        matchId: string;
        map: string;
        mode: string;
        isCompetitive: boolean;
        result: 'win' | 'loss';
        agent: { name: string; icon: string | null };
        stats: { kills: number; deaths: number; assists: number; kd: number } | null;
        gameStart: number;
    }[];
    mapPerformance: {
        map: string;
        wins: number;
        losses: number;
        total: number;
        winRate: number;
    }[];
}

type ErrorType = 'rate_limit' | 'not_found' | 'unknown' | null;

export default function TrackerProfilePage() {
    const params = useParams();
    const slug = params.slug as string;
    
    const [data, setData] = useState<TrackerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorType, setErrorType] = useState<ErrorType>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Slug format: "nome-tag" where tag is last segment after final "-"
                const parts = slug.split('-');
                if (parts.length < 2) throw new Error('Riot ID inválido.');
                const tag = parts.pop()!;
                const nome = parts.join('-'); // preserves hyphens in names
                
                const res = await api.get(`/tracker/${encodeURIComponent(nome)}/${encodeURIComponent(tag)}`);
                setData(res.data);
            } catch (err: any) {
                const type: ErrorType = err.response?.data?.error?.type || 'unknown';
                setErrorType(type);
                setErrorMsg(err.response?.data?.error?.message || err.message || 'Erro desconhecido.');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin" />
                    <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Carregando dados do agente...</p>
                </div>
            </div>
        );
    }

    if (errorType || !data) {
        const banners: Record<string, { title: string; msg: string; icon: string }> = {
            rate_limit: {
                title: 'Limite de buscas atingido',
                msg: 'Muitas buscas em pouco tempo. Aguarde alguns segundos e tente novamente.',
                icon: '⏳',
            },
            not_found: {
                title: 'Agente Desaparecido',
                msg: 'Jogador não encontrado. Confere se o Riot ID está certo (Nome#Tag).',
                icon: '👻',
            },
            unknown: {
                title: 'Erro desconhecido',
                msg: errorMsg || 'Algo deu errado. Tenta recarregar a página.',
                icon: '💥',
            },
        };
        const b = banners[errorType || 'unknown'];
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
                <motion.div
                    className="text-center max-w-md px-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p className="text-6xl mb-4">{b.icon}</p>
                    <h2 className="font-chakra font-black text-2xl text-white uppercase tracking-wider mb-2">{b.title}</h2>
                    <p className="text-zinc-400">{b.msg}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-sm px-8 py-3 clip-tatico transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-base)] pb-20 relative">
            <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
            
            {/* Banner/Header */}
            <div className="h-64 relative overflow-hidden flex items-end px-4 md:px-12 pb-6">
                <motion.div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 blur-sm"
                    style={{ backgroundImage: `url(${data.conta.card_url})` }}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ duration: 1 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/80 to-transparent" />
                
                <div className="relative z-10 flex items-end gap-6">
                    <motion.img 
                        src={data.conta.card_url} 
                        alt="Player Card" 
                        className="w-32 h-32 md:w-40 md:h-40 object-cover clip-tatico border-2 border-zinc-800 shadow-2xl"
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                    />
                    <motion.div 
                        className="mb-2"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h1 className="font-chakra font-black text-4xl md:text-5xl text-white uppercase tracking-wider">
                            {data.conta.nome}
                        </h1>
                        <p className="text-red-400 font-mono text-lg mt-1">#{data.conta.tag} <span className="text-zinc-500 ml-2 text-sm uppercase font-sans">Nível <AnimatedCounter value={data.conta.level} duration={2} /></span></p>
                    </motion.div>
                </div>
            </div>

            <motion.div 
                className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                
                {/* Left Column (Rank & Stats) */}
                <aside className="tracker-sidebar">
                    {/* Rank Card Redesign */}
                    <div className="current-rank-card glass-panel">
                        <div className="rank-icon-frame">
                            {data.rank?.icon ? (
                                <img 
                                    src={data.rank.icon}
                                    alt={data.rank.name || 'Unranked'}
                                    className="opacity-0 transition-opacity duration-300 w-full h-full object-contain drop-shadow-2xl"
                                    onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-800 rounded-full animate-pulse" />
                            )}
                        </div>

                        <div className="flex-1">
                            <h2 className="font-chakra font-black text-2xl text-white uppercase tracking-wider">
                                {data.rank?.name || 'Unranked'}
                            </h2>
                            <p className="text-zinc-400 font-mono">
                                {data.rank?.rr !== null && data.rank?.rr !== undefined ? `${data.rank.rr} RR` : 'RR indisponível'}
                            </p>
                            {data.rank?.rrChange !== null && data.rank?.rrChange !== undefined && (
                                <p className={`text-sm mt-1 font-bold ${data.rank.rrChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {data.rank.rrChange >= 0 ? '▲' : '▼'} {Math.abs(data.rank.rrChange)} última partida
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Rank Progress Bar */}
                    {data.rank?.rr !== null && data.rank?.rr !== undefined && (
                        <div className="bg-[var(--bg-surface)] border border-zinc-800 p-4 clip-tatico-tr">
                            <div className="flex justify-between text-xs text-zinc-400 font-bold uppercase mb-2">
                                <span>Progresso da Patente</span>
                                <span>{data.rank.rr} / 100 RR</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                                <div 
                                    className="h-full bg-red-500 transition-all duration-1000 ease-out" 
                                    style={{ width: `${Math.min(Math.max(data.rank.rr, 0), 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Map Performance Chart */}
                    <div className="bg-[var(--bg-surface)] border border-zinc-800 p-4 clip-tatico-tr">
                        <div className="mb-4">
                            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-500">Performance por Mapa</h3>
                            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Apenas partidas competitivas</span>
                        </div>
                        <div className="space-y-4">
                            {data.mapPerformance?.length === 0 ? (
                                <p className="text-zinc-600 text-sm">Sem partidas competitivas recentes.</p>
                            ) : (
                                data.mapPerformance?.map((mapStats: any) => (
                                    <div key={mapStats.map} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white font-medium">{mapStats.map}</span>
                                            <span className="text-zinc-400">{mapStats.winRate}% Win ({mapStats.wins}W {mapStats.losses}L)</span>
                                        </div>
                                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-zinc-300"
                                                style={{ width: `${mapStats.winRate}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* Right Column (Matches) */}
                <div className="md:col-span-2">
                    <h3 className="font-chakra font-black text-2xl text-white uppercase mb-6 tracking-wider flex items-center gap-3">
                        <span className="w-8 h-1 bg-red-600 block"></span>
                        Últimas Partidas
                    </h3>
                    
                    <AnimatedList className="space-y-3">
                        {data.matches?.map((match: any) => {
                            if (!match.stats) return null;
                            const kd = match.stats.deaths > 0 ? (match.stats.kills / match.stats.deaths).toFixed(2) : match.stats.kills;
                            
                            return (
                                <AnimatedListItem 
                                    key={match.matchId}
                                    className={`match-card flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 ${
                                        match.result === 'win' 
                                            ? 'match-card-win' 
                                            : match.result === 'loss'
                                                ? 'match-card-loss'
                                                : 'match-card-draw'
                                    }`}
                                >
                                    <div className="pl-2 flex-1">
                                        <p className={`font-black font-chakra uppercase text-lg ${
                                            match.result === 'win' ? 'text-green-400' : match.result === 'loss' ? 'text-red-400' : 'text-zinc-400'
                                        }`}>
                                            {match.result === 'win' ? 'Vitória' : match.result === 'loss' ? 'Derrota' : 'Empate'}
                                        </p>
                                        <p className="text-sm text-zinc-400">{match.map} • {match.mode}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-6 glass-panel px-6 py-3 rounded clip-tatico w-full sm:w-auto justify-between sm:justify-start">
                                        <div className="text-center flex flex-col items-center gap-1">
                                            <div className="w-12 h-12 hex-avatar flex items-center justify-center overflow-hidden relative group">
                                                <div className="absolute inset-0 skeleton bg-zinc-800" />
                                                <img
                                                    src={match.agent.icon || '/assets/placeholder-agent.svg'}
                                                    alt={match.agent.name}
                                                    className="w-[120%] h-[120%] object-cover relative z-10 opacity-0 transition-opacity duration-300"
                                                    onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                                                    loading="lazy"
                                                />
                                            </div>
                                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{match.agent.name}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">K / D / A</p>
                                            <p className="text-white font-mono font-bold tracking-widest">
                                                <span className="text-green-400">{match.stats.kills}</span> / 
                                                <span className="text-red-400"> {match.stats.deaths}</span> / 
                                                <span className="text-zinc-400"> {match.stats.assists}</span>
                                            </p>
                                        </div>
                                        <div className="text-center hidden sm:block">
                                            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">K/D</p>
                                            <p className={`font-mono font-bold ${Number(kd) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                                                {kd}
                                            </p>
                                        </div>
                                    </div>
                                </AnimatedListItem>
                            );
                        })}
                        
                        {(!data.matches || data.matches.length === 0) && (
                            <p className="text-zinc-500 text-center py-12">Nenhuma partida recente encontrada.</p>
                        )}
                    </AnimatedList>
                </div>
            </motion.div>
        </div>
    );
}
