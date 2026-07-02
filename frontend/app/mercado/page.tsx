'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import api from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Users, Filter, CheckCircle2, MessageSquare } from 'lucide-react';
import Link from 'next/link';


interface JogadorLFT {
    id: number;
    nome: string;
    riot_id: string;
    discord_id: string | null;
    lft_role: string | null;
    lft_mensagem: string | null;
}

export default function MercadoTransferencias() {
    const [user, setUser] = useState<{ id: number } | null>(null);
    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (u) {
            try { setUser(JSON.parse(u)); } catch {}
        }
    }, []);
    const { data: jogadores, error, mutate } = useSWR<JogadorLFT[]>('/lft', fetcher);
    
    // Meu status
    const { data: meuStatus, mutate: mutateMeuStatus } = useSWR(user ? '/lft/me' : null, fetcher);
    
    const [isLftEnabled, setIsLftEnabled] = useState(false);
    const [role, setRole] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (meuStatus) {
            setIsLftEnabled(meuStatus.lft_status === 1);
            setRole(meuStatus.lft_role || '');
            setMensagem(meuStatus.lft_mensagem || '');
        }
    }, [meuStatus]);

    const salvarStatus = async () => {
        if (!user) return toast.error('Você precisa estar logado!');
        setIsSaving(true);
        try {
            await api.put('/lft/me', { status: isLftEnabled, role, mensagem });
            toast.success('Status atualizado!');
            mutate();
            mutateMeuStatus();
        } catch (err: any) {
            toast.error('Erro ao atualizar status.');
        } finally {
            setIsSaving(false);
        }
    };

    const isLoading = !jogadores && !error;

    return (
        <div className="max-w-6xl mx-auto px-4 py-24">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                {/* Lado Esquerdo: Lista */}
                <div className="flex-1 w-full">
                    <div className="mb-8">
                        <p className="text-red-500 text-xs font-bold tracking-[0.3em] uppercase mb-1">
                            Scouting
                        </p>
                        <h1 className="text-4xl font-black text-white uppercase" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                            Mercado de Transferências
                        </h1>
                        <p className="text-zinc-400 mt-2">
                            Encontre jogadores "Free Agents" procurando por times.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="skeleton h-32 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : jogadores?.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-zinc-400">Nenhum jogador procurando time no momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {jogadores?.map((jog) => (
                                <motion.div 
                                    key={jog.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 clip-tatico hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{jog.riot_id || jog.nome}</h3>
                                            <span className="text-xs text-red-400 font-semibold uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded">
                                                {jog.lft_role || 'Flex'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                                        "{jog.lft_mensagem || 'Procurando um time competitivo para fechar line.'}"
                                    </p>
                                    
                                    <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
                                        {jog.discord_id ? (
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(jog.discord_id!);
                                                    toast.success('Discord ID copiado!');
                                                }}
                                                className="text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition-colors flex items-center gap-2 cursor-pointer"
                                            >
                                                <MessageSquare className="w-3 h-3" />
                                                Discord: {jog.discord_id}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-zinc-500 italic">Discord não vinculado</span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lado Direito: Meu Status */}
                <div className="w-full md:w-80 shrink-0">
                    <div className="bg-zinc-900/80 border border-red-900/30 p-6 clip-tatico sticky top-24">
                        <h2 className="text-xl font-bold text-white mb-6 uppercase" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>Seu Status</h2>
                        
                        {!user ? (
                            <div className="text-center">
                                <p className="text-zinc-400 text-sm mb-4">Faça login para anunciar que está procurando time.</p>
                                <Link href="/login" className="block w-full bg-red-600 hover:bg-red-500 text-white text-center py-2 font-bold uppercase text-sm clip-tatico transition-colors">
                                    Fazer Login
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isLftEnabled}
                                        onChange={(e) => setIsLftEnabled(e.target.checked)}
                                        className="w-5 h-5 accent-red-500 bg-zinc-800 border-zinc-700 rounded"
                                    />
                                    <span className="text-zinc-300 font-semibold">Estou procurando time</span>
                                </label>

                                {isLftEnabled && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-4 pt-2"
                                    >
                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Role Principal</label>
                                            <select 
                                                value={role} 
                                                onChange={e => setRole(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 text-white p-2 text-sm outline-none focus:border-red-500 rounded"
                                            >
                                                <option value="">Selecione (Flex)</option>
                                                <option value="Duelista">Duelista</option>
                                                <option value="Iniciador">Iniciador</option>
                                                <option value="Controlador">Controlador</option>
                                                <option value="Sentinela">Sentinela</option>
                                                <option value="IGL">IGL / Capitão</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Mensagem (Opcional)</label>
                                            <textarea 
                                                value={mensagem}
                                                onChange={e => setMensagem(e.target.value)}
                                                placeholder="Disponível todo dia às 20h. Foco em camp."
                                                className="w-full bg-zinc-950 border border-zinc-800 text-white p-2 text-sm outline-none focus:border-red-500 rounded h-20 resize-none"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <button 
                                    onClick={salvarStatus}
                                    disabled={isSaving}
                                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 font-bold uppercase tracking-wider text-sm clip-tatico mt-4 transition-colors cursor-pointer"
                                >
                                    {isSaving ? 'Salvando...' : 'Atualizar Status'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
