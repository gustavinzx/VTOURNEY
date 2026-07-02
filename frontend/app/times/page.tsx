'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { motion } from 'framer-motion';
import TimeCard from '@/components/TimeCard';
import { Shield } from 'lucide-react';

interface Time {
    id: number;
    nome: string;
    tag?: string;
    capitao_nome: string;
    total_membros: number;
}

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function TimesPage() {
    const [busca, setBusca] = useState('');
    const { data: timesData, error } = useSWR<Time[]>('/times', fetcher);
    const times = timesData || [];
    const loading = !timesData && !error;

    const filtered = times.filter(
        (t) =>
            t.nome.toLowerCase().includes(busca.toLowerCase()) ||
            (t.tag && t.tag.toLowerCase().includes(busca.toLowerCase()))
    );

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                <div>
                    <p className="text-red-400 text-xs font-bold tracking-[0.3em] uppercase mb-2">Competidores</p>
                    <h1
                        className="text-4xl font-black text-white"
                        style={{ fontFamily: 'var(--font-chakra), sans-serif' }}
                    >
                        Times
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {loading ? '...' : `${times.length} times cadastrados`}
                    </p>
                </div>
                <Link
                    href="/times/criar"
                    className="self-start sm:self-auto flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-red-900/30 hover:scale-105 active:scale-95"
                >
                    + Criar time
                </Link>
            </div>

            {/* Search */}
            {!loading && times.length > 0 && (
                <div className="mb-6">
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por nome ou tag..."
                        className="w-full sm:max-w-sm bg-zinc-900 border border-zinc-800 focus:border-red-600 text-white rounded-xl px-4 py-2.5 outline-none transition-all text-sm placeholder:text-zinc-600"
                    />
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton h-20 rounded-xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <motion.div
                    className="border border-dashed border-zinc-800 rounded-2xl p-16 text-center flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Shield className="w-10 h-10 text-zinc-600 mb-4" />
                    <p className="text-zinc-400 mb-2 font-medium">
                        {busca ? 'Nenhum time encontrado.' : 'Nenhum time cadastrado ainda.'}
                    </p>
                    {!busca && (
                        <Link href="/times/criar" className="text-red-400 hover:text-red-300 text-sm">
                            Seja o primeiro a criar um →
                        </Link>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    className="space-y-3"
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                >
                    {filtered.map((t) => (
                        <motion.div key={t.id} variants={item}>
                            <TimeCard {...t} href={`/times/${t.id}`} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
