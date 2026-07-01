'use client';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { GlitchText } from '@/components/ui/GlitchText';
import { CircleStack } from '@/components/ui/CircleStack';
import BlurText from '@/components/ui/BlurText';
import TorneioCard from '@/components/TorneioCard';

interface Torneio {
    id: number;
    nome: string;
    formato: string;
    max_times: number;
    times_aprovados: number;
    status: string;
    organizador_nome: string;
    data_inicio: string | null;
}

const staggerContainer = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

const cardVariant = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' as const },
    },
};

function SkeletonCard() {
    return (
        <div className="border border-zinc-800 rounded-xl p-5 space-y-4 clip-tatico">
            <div className="flex justify-between items-start gap-2">
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-5 w-28 rounded-full" />
            </div>
            <div className="space-y-2">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
            </div>
            <div className="pt-2 border-t border-zinc-800">
                <div className="skeleton h-1 w-full rounded-full" />
            </div>
        </div>
    );
}

// Debounce simples — evita disparar uma request a cada tecla digitada.
// 300ms é o sweet spot: imperceptível para o usuário, mas elimina 90%+ das requests
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

const STATUS_TABS = [
    { value: '', label: 'Todos' },
    { value: 'inscricoes_abertas', label: 'Abertos' },
    { value: 'em_andamento',       label: 'Em andamento' },
    { value: 'finalizado',         label: 'Finalizados' },
];

function HomeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Lê filtros iniciais da URL (links compartilháveis sobrevivem ao reload)
    const [status, setStatus]   = useState(searchParams.get('status') ?? '');
    const [busca,  setBusca]    = useState(searchParams.get('q') ?? '');
    const [sort,   setSort]     = useState(searchParams.get('sort') ?? 'recentes');

    const buscaDebounced = useDebounce(busca, 300);

    const [torneios, setTorneios] = useState<Torneio[]>([]);
    const [loading, setLoading]   = useState(true);

    // Busca torneios sempre que um filtro muda
    useEffect(() => {
        setLoading(true);

        // Sync URL com os filtros atuais
        const params = new URLSearchParams();
        if (status)           params.set('status', status);
        if (buscaDebounced)   params.set('q', buscaDebounced);
        if (sort !== 'recentes') params.set('sort', sort);
        const qs = params.toString();
        router.replace(qs ? `?${qs}` : '/', { scroll: false });

        api.get(`/torneios${qs ? `?${qs}` : ''}`)
            .then(r => setTorneios(r.data))
            .catch(() => setTorneios([]))
            .finally(() => setLoading(false));
    }, [status, buscaDebounced, sort]);

    const abertos = torneios.filter(t => t.status === 'inscricoes_abertas').length;

    return (
        <div>
            {/* ── Hero ────────────────────────────────────────────── */}
            <div className="relative w-full overflow-hidden bg-zinc-950 border-b border-zinc-900">
                {/* Subtle tactical grid background */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                <div className="max-w-6xl mx-auto px-4 py-24 md:py-32 grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
                    <div className="md:col-span-7">
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-wider mb-6 leading-none flex flex-col items-start gap-2" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                            <BlurText
                                text="Domine o"
                                delay={50}
                                animateBy="words"
                                direction="top"
                            />
                            <GlitchText text="Cenário Amador" className="text-red-500" />
                        </h1>
                        <p className="text-zinc-400 text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
                            Organize campeonatos, ache seu time ideal e mostre que seu rank não é só enfeite.
                        </p>
                        
                        <div className="mb-10">
                            <CircleStack totalCount={2400} />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            <Link
                                href="/torneios"
                                className="bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-sm px-8 py-4 clip-tatico transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                            >
                                Ver torneios abertos
                            </Link>
                            <Link
                                href="/tracker"
                                className="bg-transparent border border-zinc-700 hover:border-red-500 text-zinc-300 hover:text-white font-bold uppercase tracking-wider text-sm px-8 py-4 clip-tatico transition-all"
                            >
                                Buscar um jogador
                            </Link>
                        </div>
                    </div>
                    
                    {/* Live Preview Teaser */}
                    <div className="md:col-span-5 relative">
                        <div className="bg-zinc-950/80 border border-zinc-800 p-6 clip-tatico shadow-2xl backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Acontecendo Agora</span>
                            </div>
                            <h3 className="text-white text-xl uppercase mb-2 font-black" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>Copa Ignição Series #4</h3>
                            <p className="text-zinc-400 text-sm mb-6">Fase de Grupos • MD1</p>
                            
                            <div className="flex justify-between items-center text-sm font-mono border-t border-zinc-800 pt-4">
                                <span className="text-zinc-500">Espectadores: 142</span>
                                <span className="text-red-400">Assista ao Vivo &rarr;</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Torneios ─────────────────────────────────────────── */}
            <section className="max-w-6xl mx-auto px-4 py-14">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-red-500 text-xs font-bold tracking-[0.3em] uppercase mb-1">
                            Arena
                        </p>
                        <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                            Torneios
                        </h2>
                    </div>
                    <Link
                        href="/torneios/criar"
                        className="flex items-center gap-2 border border-red-600/50 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                        <span>+</span>
                        Criar torneio
                    </Link>
                </div>

                {/* ── Filtros ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {/* Busca */}
                    <div className="relative flex-1 max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
                        <input
                            id="filtro-busca"
                            type="text"
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            placeholder="Buscar torneio..."
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 text-white rounded-xl pl-9 pr-4 py-2 outline-none transition-all text-sm placeholder:text-zinc-600"
                        />
                        {busca && (
                            <button
                                onClick={() => setBusca('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors text-xs"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* Sort */}
                    <select
                        id="filtro-sort"
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 focus:border-red-600 text-zinc-300 rounded-xl px-3 py-2 outline-none text-sm cursor-pointer transition-colors"
                    >
                        <option value="recentes">Mais recentes</option>
                        <option value="vagas">Mais vagas</option>
                    </select>
                </div>

                {/* Status tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            id={`tab-status-${tab.value || 'todos'}`}
                            onClick={() => setStatus(tab.value)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                status === tab.value
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : torneios.length === 0 ? (
                    <motion.div
                        className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p className="text-4xl mb-4">🎯</p>
                        <p className="text-zinc-400 mb-2 font-medium">
                            {busca || status ? 'Nenhum torneio encontrado com esses filtros.' : 'Nenhum torneio ainda.'}
                        </p>
                        {!busca && !status && (
                            <Link href="/torneios/criar" className="text-red-400 hover:text-red-300 text-sm">
                                Seja o primeiro a criar um →
                            </Link>
                        )}
                        {(busca || status) && (
                            <button
                                onClick={() => { setBusca(''); setStatus(''); }}
                                className="text-red-400 hover:text-red-300 text-sm"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {torneios.map((t) => (
                            <motion.div key={t.id} variants={cardVariant}>
                                <TorneioCard {...t} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </section>
        </div>
    );
}

export default function Home() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="skeleton w-12 h-12 rounded-full animate-spin" />
            </div>
        }>
            <HomeContent />
        </Suspense>
    );
}
