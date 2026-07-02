'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import api, { fetcher } from '@/lib/api';
import { toast } from 'sonner';

import { ShieldAlert, Check, X, Trophy } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<{ id: number } | null>(null);

    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (u) {
            try { setUser(JSON.parse(u)); } catch {}
        }
    }, []);
    
    const { data: torneio, error, mutate } = useSWR(`/torneios/${id}`, fetcher);
    
    // Authorization check
    useEffect(() => {
        if (torneio && user) {
            if (torneio.organizador_id !== user.id) {
                toast.error('Acesso negado.');
                router.push(`/torneios/${id}`);
            }
        }
    }, [torneio, user, router, id]);

    if (!torneio) return <div className="p-20 text-center skeleton h-64 w-full" />;

    const aprovarInscricao = async (inscricao_id: number) => {
        try {
            await api.put(`/torneios/${id}/admin/inscricoes/${inscricao_id}/status`, { status: 'aprovada' });
            toast.success('Inscrição aprovada!');
            mutate();
        } catch (err) {
            toast.error('Erro ao aprovar.');
        }
    };

    const rejeitarInscricao = async (inscricao_id: number) => {
        try {
            await api.put(`/torneios/${id}/admin/inscricoes/${inscricao_id}/status`, { status: 'rejeitada' });
            toast.success('Inscrição rejeitada!');
            mutate();
        } catch (err) {
            toast.error('Erro ao rejeitar.');
        }
    };

    const forcarVitoria = async (partida_id: number, time_vencedor_id: number) => {
        try {
            await api.put(`/torneios/${id}/admin/partidas/${partida_id}/override`, { 
                time_vencedor_id,
                status: 'finalizada'
            });
            toast.success('Resultado forçado com sucesso!');
            mutate();
        } catch (err) {
            toast.error('Erro ao forçar resultado.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
                <div className="w-12 h-12 bg-red-600/10 flex items-center justify-center rounded-xl border border-red-500/20 text-red-500">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black uppercase text-white" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                        Admin: {torneio.nome}
                    </h1>
                    <p className="text-zinc-400">Gerencie inscrições e disputas.</p>
                </div>
                <Link href={`/torneios/${id}`} className="ml-auto text-sm text-zinc-400 hover:text-white underline">
                    Voltar pro torneio
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gestão de Inscrições */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 clip-tatico">
                    <h2 className="text-xl font-bold text-white mb-4 uppercase" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                        Inscrições Pendentes
                    </h2>
                    <div className="space-y-3">
                        {torneio.inscricoes?.filter((i: any) => i.status === 'pendente').map((insc: any) => (
                            <div key={insc.id} className="flex items-center justify-between bg-zinc-950 p-4 border border-zinc-800 rounded">
                                <div>
                                    <p className="font-bold text-white">{insc.time_nome}</p>
                                    <p className="text-xs text-zinc-500">Data: {new Date(insc.criado_em).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => aprovarInscricao(insc.id)}
                                        className="bg-green-600/20 hover:bg-green-600/40 text-green-500 p-2 rounded transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => rejeitarInscricao(insc.id)}
                                        className="bg-red-600/20 hover:bg-red-600/40 text-red-500 p-2 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {torneio.inscricoes?.filter((i: any) => i.status === 'pendente').length === 0 && (
                            <p className="text-sm text-zinc-500 text-center py-4">Nenhuma inscrição pendente.</p>
                        )}
                    </div>
                </div>

                {/* Gestão de Partidas */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 clip-tatico">
                    <h2 className="text-xl font-bold text-white mb-4 uppercase flex items-center justify-between" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                        <span>Forçar Resultado (W.O)</span>
                    </h2>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {torneio.partidas?.filter((p: any) => p.status !== 'finalizada').map((partida: any) => (
                            <div key={partida.id} className="bg-zinc-950 p-4 border border-zinc-800 rounded">
                                <div className="text-xs text-zinc-500 mb-2 font-mono">Rodada {partida.rodada}</div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 text-center">
                                        <p className="font-bold text-sm text-white">{partida.time1_nome || 'TBD'}</p>
                                        {partida.time1_id && (
                                            <button 
                                                onClick={() => forcarVitoria(partida.id, partida.time1_id)}
                                                className="text-[10px] uppercase font-bold text-zinc-400 hover:text-green-400 mt-1"
                                            >
                                                Forçar Win T1
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-zinc-600 text-xs">VS</span>
                                    <div className="flex-1 text-center">
                                        <p className="font-bold text-sm text-white">{partida.time2_nome || 'TBD'}</p>
                                        {partida.time2_id && (
                                            <button 
                                                onClick={() => forcarVitoria(partida.id, partida.time2_id)}
                                                className="text-[10px] uppercase font-bold text-zinc-400 hover:text-green-400 mt-1"
                                            >
                                                Forçar Win T2
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {torneio.partidas?.filter((p: any) => p.status !== 'finalizada').length === 0 && (
                            <p className="text-sm text-zinc-500 text-center py-4">Nenhuma partida em aberto.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
