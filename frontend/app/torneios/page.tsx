'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import TorneioCard from '@/components/TorneioCard';
import { PlusCircle, Search, Calendar, Users, Trophy } from 'lucide-react';

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

const STATUS_TABS = [
    { value: '', label: 'Todos' },
    { value: 'inscricoes_abertas', label: 'Abertos' },
    { value: 'em_andamento',       label: 'Em andamento' },
    { value: 'finalizado',         label: 'Finalizados' },
];

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function TorneiosPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [status, setStatus] = useState(searchParams.get('status') ?? '');
    const [busca, setBusca] = useState(searchParams.get('q') ?? '');
    const [sort, setSort] = useState(searchParams.get('sort') ?? 'recentes');
    const buscaDebounced = useDebounce(busca, 300);

    const [torneios, setTorneios] = useState<Torneio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (buscaDebounced) params.set('q', buscaDebounced);
        if (sort !== 'recentes') params.set('sort', sort);

        const qs = params.toString();
        
        // Atualiza a URL sem recarregar a página
        router.replace(`/torneios${qs ? `?${qs}` : ''}`, { scroll: false });

        api.get(`/torneios${qs ? `?${qs}` : ''}`)
            .then((res) => {
                setTorneios(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [status, buscaDebounced, sort, router]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 mt-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-wider text-white">Torneios</h1>
                    <p className="text-zinc-400 mt-1">Explore, participe e vença campeonatos da comunidade.</p>
                </div>
                <Link
                    href="/torneios/criar"
                    className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <PlusCircle className="w-4 h-4" />
                    Criar Torneio
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar torneio pelo nome..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setStatus(tab.value)}
                            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm transition-all border ${
                                status === tab.value
                                    ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                                    : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors text-zinc-300"
                    >
                        <option value="recentes">Mais recentes</option>
                        <option value="antigos">Mais antigos</option>
                        <option value="vagas">Maior nº de vagas</option>
                    </select>
                </div>
            </div>

            {/* Torneios Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border border-zinc-800 rounded-xl p-5 space-y-4 bg-zinc-900/20 animate-pulse">
                            <div className="h-5 bg-zinc-800 rounded w-1/3" />
                            <div className="h-4 bg-zinc-800 rounded w-1/2" />
                            <div className="h-10 bg-zinc-800 rounded w-full mt-4" />
                        </div>
                    ))
                ) : torneios.length > 0 ? (
                    torneios.map((torneio) => (
                        <motion.div
                            key={torneio.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <TorneioCard {...torneio} />
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                        Nenhum torneio encontrado com os filtros selecionados.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TorneiosPage() {
    return (
        <Suspense fallback={
            <div className="max-w-6xl mx-auto px-4 py-8 mt-16 animate-pulse">
                <div className="h-10 bg-zinc-800 rounded w-1/4 mb-8" />
                <div className="h-20 bg-zinc-900 rounded-xl mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="h-40 bg-zinc-900 rounded-xl" />
                    <div className="h-40 bg-zinc-900 rounded-xl" />
                    <div className="h-40 bg-zinc-900 rounded-xl" />
                </div>
            </div>
        }>
            <TorneiosPageContent />
        </Suspense>
    );
}
