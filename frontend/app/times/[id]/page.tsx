'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import Modal from '@/components/Modal';

interface Membro {
    id: number;
    nome: string;
    riot_id?: string;
    funcao: string;
}

interface Time {
    id: number;
    nome: string;
    tag?: string;
    capitao_id: number;
    capitao_nome: string;
    criado_em: string;
    convite_token?: string;
    membros: Membro[];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

function stringToHue(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

const funcaoLabel: Record<string, string> = {
    titular: 'Titular',
    reserva: 'Reserva',
    capitao: 'Capitão',
};

export default function TimePerfilPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [usuario, setUsuario] = useState<{ id: number } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    async function deletarTime() {
        try {
            await api.delete(`/times/${id}`);
            toast.success('Time excluído com sucesso.');
            router.push('/times');
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao excluir time');
        }
    }

    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (u) setUsuario(JSON.parse(u));
    }, []);

    const { data: time, mutate: mutateTime, error } = useSWR<Time>(id ? `/times/${id}` : null, fetcher);
    const loading = !time && !error;

    if (error) {
        toast.error('Time não encontrado');
        router.push('/times');
    }

    async function removerMembro(userId: number) {
        if (!confirm('Deseja realmente remover este membro?')) return;
        try {
            await api.delete(`/times/${id}/membros/${userId}`);
            toast.success('Membro removido.');
            mutateTime();
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao remover membro');
        }
    }

    async function sairDoTime() {
        if (!usuario) return;
        if (!confirm('Deseja realmente sair do time?')) return;
        try {
            await api.delete(`/times/${id}/membros/${usuario.id}`);
            toast.success('Você saiu do time.');
            router.push('/times');
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao sair do time');
        }
    }

    function copiarConvite() {
        if (!time?.convite_token) return;
        const link = `${window.location.origin}/times/convite/${time.convite_token}`;
        navigator.clipboard.writeText(link);
        toast.success('Link de convite copiado!');
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
                <div className="skeleton h-8 w-48 rounded" />
                <div className="skeleton h-32 rounded-2xl" />
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (!time) return null;

    const isCapitao = usuario?.id === time.capitao_id;
    const hue = stringToHue(time.nome);

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-zinc-600 mb-6">
                <Link href="/times" className="hover:text-zinc-400 transition-colors">Times</Link>
                <span>/</span>
                <span className="text-zinc-400">{time.nome}</span>
            </div>

            {/* Header */}
            <motion.div
                className="relative bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden p-6 md:p-8 mb-6"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                    borderColor: `hsl(${hue}, 60%, 35%, 0.2)`,
                    boxShadow: `0 0 40px hsla(${hue}, 60%, 40%, 0.1)`,
                }}
            >
                {/* Glow */}
                <div
                    className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20"
                    style={{ background: `hsl(${hue}, 70%, 50%)` }}
                />

                <div className="relative z-10 flex items-center gap-5">
                    {/* Logo */}
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-xl"
                        style={{
                            background: `linear-gradient(135deg, hsl(${hue},70%,35%), hsl(${hue},60%,20%))`,
                            boxShadow: `0 8px 24px hsla(${hue},70%,40%,0.35)`,
                        }}
                    >
                        {(time.tag ?? time.nome).slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1
                            className="text-3xl font-black text-white"
                            style={{ fontFamily: 'var(--font-chakra), sans-serif' }}
                        >
                            {time.nome}
                        </h1>
                        {time.tag && (
                            <p className="text-zinc-500 font-mono text-sm">#{time.tag}</p>
                        )}
                        <p className="text-zinc-400 text-sm mt-1">
                            Capitão: <span className="text-zinc-300 font-medium">{time.capitao_nome}</span>
                        </p>
                        <p className="text-zinc-600 text-xs mt-1">
                            Criado em {new Date(time.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                    </div>

                    {usuario && time.capitao_id === usuario.id ? (
                        <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            <button
                                onClick={() => {
                                    if (confirmDelete) deletarTime();
                                    else {
                                        setConfirmDelete(true);
                                        setTimeout(() => setConfirmDelete(false), 3000);
                                    }
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    confirmDelete 
                                        ? 'bg-red-600 text-white animate-pulse' 
                                        : 'border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-400/50'
                                }`}
                                title="Ação destrutiva"
                            >
                                {confirmDelete ? 'Confirmar Exclusão' : 'Excluir Time'}
                            </button>
                            {time.convite_token && (
                                <button
                                    onClick={copiarConvite}
                                    className="border border-red-600/50 text-red-400 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                >
                                    Copiar Convite
                                </button>
                            )}
                        </div>
                    ) : (
                        usuario && time.membros.some((m: any) => m.id === usuario.id) ? (
                            <div className="shrink-0 flex items-center gap-2">
                                <button
                                    onClick={sairDoTime}
                                    className="border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-400/50 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                >
                                    Sair do Time
                                </button>
                            </div>
                        ) : null
                    )}
                </div>
            </motion.div>

            {/* Membros */}
            <div>
                <h2
                    className="text-lg font-bold text-white mb-4"
                    style={{ fontFamily: 'var(--font-chakra), sans-serif' }}
                >
                    Membros ({time.membros.length})
                </h2>

                <motion.div
                    className="space-y-3"
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                >
                    {time.membros.map((m) => (
                        <motion.div
                            key={m.id}
                            variants={{
                                hidden: { opacity: 0, x: -12 },
                                visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                            }}
                            className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 transition-colors"
                        >
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-black text-white shrink-0">
                                {getInitials(m.nome)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm">{m.nome}</p>
                                {m.riot_id && (
                                    <p className="text-xs text-zinc-500 font-mono truncate">{m.riot_id}</p>
                                )}
                            </div>

                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                                {funcaoLabel[m.funcao] ?? m.funcao}
                            </span>
                            {isCapitao && m.id !== usuario?.id && (
                                <button 
                                    onClick={() => removerMembro(m.id)}
                                    className="ml-2 text-zinc-600 hover:text-red-500"
                                    title="Remover Jogador"
                                >
                                    ✖
                                </button>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
