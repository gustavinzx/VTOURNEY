'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import api, { fetcher } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MessageSquare, Send, Map as MapIcon, Flag, Shield, AlertTriangle } from 'lucide-react';

const MAP_POOL = ['Ascent', 'Bind', 'Breeze', 'Icebox', 'Lotus', 'Split', 'Sunset'];

export default function PartidaRoomPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [usuario, setUsuario] = useState<{ id: number; nome: string } | null>(null);
    const [chatMsg, setChatMsg] = useState('');
    const [reportando, setReportando] = useState(false);
    const [placarA, setPlacarA] = useState(0);
    const [placarB, setPlacarB] = useState(0);

    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (u) setUsuario(JSON.parse(u));
    }, []);

    const { data: partida, mutate, error } = useSWR(id ? `/partidas/${id}` : null, fetcher, {
        refreshInterval: 3000 // Poll a cada 3s para chat e vetos (solução rápida)
    });

    if (error) {
        return <div className="p-10 text-center text-red-500">Erro ao carregar a partida.</div>;
    }

    if (!partida) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-12 flex gap-6">
                <div className="flex-1 skeleton h-[500px] rounded-2xl" />
                <div className="w-80 skeleton h-[500px] rounded-2xl hidden lg:block" />
            </div>
        );
    }

    const isOrganizer = usuario?.id === partida.organizador_id;
    const isCapitaoA = usuario?.id === partida.time_a_capitao;
    const isCapitaoB = usuario?.id === partida.time_b_capitao;
    const myTeamId = isCapitaoA ? partida.time_a_id : (isCapitaoB ? partida.time_b_id : null);
    const isMyTurnToVeto = partida.status === 'agendada' && myTeamId && myTeamId === partida.vez_veto_time_id;

    async function handleEnviarMsg(e: React.FormEvent) {
        e.preventDefault();
        if (!chatMsg.trim()) return;
        try {
            await api.post(`/partidas/${id}/chat`, { mensagem: chatMsg });
            setChatMsg('');
            mutate();
        } catch (err: any) {
            toast.error(err.response?.data?.erro || 'Erro ao enviar mensagem');
        }
    }

    async function handleVetoPick(mapa: string) {
        if (!isMyTurnToVeto) return;
        try {
            await api.post(`/partidas/${id}/veto`, { mapa });
            toast.success(`Mapa ${mapa} selecionado!`);
            mutate();
        } catch (err: any) {
            toast.error(err.response?.data?.erro || 'Erro ao selecionar mapa');
        }
    }

    async function reportarPlacar(e: React.FormEvent) {
        e.preventDefault();
        if (!isOrganizer) return;
        
        let vencedor_id = null;
        if (placarA > placarB) vencedor_id = partida.time_a_id;
        else if (placarB > placarA) vencedor_id = partida.time_b_id;
        else {
            toast.error('O placar não pode terminar em empate!');
            return;
        }

        if (!confirm(`Confirmar resultado: ${partida.time_a_nome} ${placarA} x ${placarB} ${partida.time_b_nome}?`)) return;

        setReportando(true);
        try {
            await api.patch(`/partidas/${id}/resultado`, {
                placar_a: placarA,
                placar_b: placarB,
                vencedor_id: parseInt(vencedor_id)
            });
            toast.success('Placar reportado e bracket avançada!');
            mutate();
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao reportar placar');
        } finally {
            setReportando(false);
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href={`/torneios/${partida.torneio_id}`} className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-2">
                    ← Voltar para {partida.torneio_nome}
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)] min-h-[600px]">
                {/* ESQUERDA - MATCH INFO & VETO */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* PLACAR HEADER */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-center min-h-[250px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] pointer-events-none" />
                        
                        <div className="text-center mb-6">
                            <span className="text-red-500 font-bold tracking-widest uppercase text-xs">
                                {partida.fase} — Match #{partida.id}
                            </span>
                            <div className="mt-2 text-zinc-400 font-mono text-sm uppercase flex items-center justify-center gap-2">
                                <Flag className="w-4 h-4" /> 
                                {partida.status === 'agendada' && 'VETO DE MAPA'}
                                {partida.status === 'ao_vivo' && 'EM ANDAMENTO (AO VIVO)'}
                                {partida.status === 'finalizada' && 'FINALIZADA'}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 z-10">
                            {/* TIME A */}
                            <div className={`flex-1 text-center ${partida.vencedor_id === partida.time_a_id ? 'text-white' : (partida.vencedor_id ? 'text-zinc-600' : 'text-white')}`}>
                                <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-2xl clip-tatico flex items-center justify-center text-2xl font-black mb-3 shadow-xl">
                                    {(partida.time_a_tag || partida.time_a_nome || 'BYE').slice(0, 2).toUpperCase()}
                                </div>
                                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                                    {partida.time_a_nome || 'BYE'}
                                </h2>
                            </div>

                            {/* SCORE */}
                            <div className="flex flex-col items-center justify-center px-4">
                                {partida.status === 'finalizada' ? (
                                    <div className="flex items-center gap-3 text-4xl md:text-5xl font-black font-mono">
                                        <span className={partida.vencedor_id === partida.time_a_id ? 'text-green-500' : 'text-zinc-500'}>{partida.placar_a}</span>
                                        <span className="text-zinc-600">:</span>
                                        <span className={partida.vencedor_id === partida.time_b_id ? 'text-green-500' : 'text-zinc-500'}>{partida.placar_b}</span>
                                    </div>
                                ) : (
                                    <div className="text-zinc-600 font-black text-2xl md:text-4xl px-4">VS</div>
                                )}
                            </div>

                            {/* TIME B */}
                            <div className={`flex-1 text-center ${partida.vencedor_id === partida.time_b_id ? 'text-white' : (partida.vencedor_id ? 'text-zinc-600' : 'text-white')}`}>
                                <div className="w-20 h-20 mx-auto bg-zinc-800 rounded-2xl clip-tatico flex items-center justify-center text-2xl font-black mb-3 shadow-xl">
                                    {(partida.time_b_tag || partida.time_b_nome || 'BYE').slice(0, 2).toUpperCase()}
                                </div>
                                <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                                    {partida.time_b_nome || 'TBD'}
                                </h2>
                            </div>
                        </div>

                        {partida.mapa_jogado && (
                            <div className="absolute bottom-4 left-0 right-0 text-center text-sm font-bold text-zinc-400 flex items-center justify-center gap-2">
                                <MapIcon className="w-4 h-4 text-red-500" />
                                MAPA: <span className="text-white uppercase">{partida.mapa_jogado}</span>
                            </div>
                        )}
                    </div>

                    {/* VETO & ADMIN ACTIONS */}
                    <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 overflow-hidden flex flex-col">
                        
                        {/* ESTADO 1: BYE */}
                        {!partida.time_b_id && partida.status === 'finalizada' && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <Shield className="w-12 h-12 text-zinc-700 mb-4" />
                                <h3 className="text-xl font-bold text-zinc-300">Avanço Automático (BYE)</h3>
                                <p className="text-zinc-500 text-sm mt-2 max-w-md">O time {partida.time_a_nome} avançou automaticamente por falta de oponente na chave.</p>
                            </div>
                        )}

                        {/* ESTADO 2: VETO DE MAPAS */}
                        {partida.time_b_id && partida.status === 'agendada' && (
                            <div className="flex-1 flex flex-col">
                                <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2 border-b border-zinc-800 pb-2">Seleção de Mapa</h3>
                                
                                <div className="mb-4 mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm flex items-center justify-between">
                                    <span className="text-zinc-400">Status atual:</span>
                                    {partida.vez_veto_time_id ? (
                                        <span className="font-bold text-white flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            Aguardando pick de {partida.vez_veto_time_id === partida.time_a_id ? partida.time_a_nome : partida.time_b_nome}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500 font-mono">Processando...</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {MAP_POOL.map(m => (
                                        <button
                                            key={m}
                                            disabled={!isMyTurnToVeto}
                                            onClick={() => handleVetoPick(m)}
                                            className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all group ${
                                                isMyTurnToVeto 
                                                    ? 'border-zinc-800 hover:border-red-500 cursor-pointer' 
                                                    : 'border-zinc-800/50 opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center font-black text-zinc-600 text-xl uppercase tracking-widest group-hover:text-white transition-colors">
                                                {m}
                                            </div>
                                            {isMyTurnToVeto && (
                                                <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    PICK MAP
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {!isCapitaoA && !isCapitaoB && (
                                    <p className="mt-4 text-xs text-zinc-500 text-center">Apenas os capitães dos times podem realizar o pick/veto dos mapas.</p>
                                )}
                            </div>
                        )}

                        {/* ESTADO 3: AO VIVO / REPORTAR PLACAR (SOMENTE ORGANIZADOR) */}
                        {partida.status === 'ao_vivo' && (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                {isOrganizer ? (
                                    <form onSubmit={reportarPlacar} className="w-full max-w-md bg-zinc-950 p-6 rounded-2xl border border-red-500/30">
                                        <div className="flex items-center gap-2 text-red-500 mb-6 font-bold uppercase tracking-widest text-sm">
                                            <AlertTriangle className="w-4 h-4" /> Painel do Organizador
                                        </div>
                                        <p className="text-zinc-400 text-sm mb-4">Insira o resultado final da partida para avançar o vencedor na bracket.</p>
                                        
                                        <div className="flex items-center justify-between gap-4 mb-6">
                                            <div className="flex-1 text-center">
                                                <p className="font-bold text-white mb-2 truncate">{partida.time_a_nome}</p>
                                                <input 
                                                    type="number" min="0" value={placarA} onChange={e => setPlacarA(parseInt(e.target.value) || 0)}
                                                    className="w-16 bg-zinc-900 border border-zinc-700 text-center text-white text-xl font-mono py-2 rounded focus:border-red-600 outline-none"
                                                />
                                            </div>
                                            <div className="text-zinc-600 font-black">X</div>
                                            <div className="flex-1 text-center">
                                                <p className="font-bold text-white mb-2 truncate">{partida.time_b_nome}</p>
                                                <input 
                                                    type="number" min="0" value={placarB} onChange={e => setPlacarB(parseInt(e.target.value) || 0)}
                                                    className="w-16 bg-zinc-900 border border-zinc-700 text-center text-white text-xl font-mono py-2 rounded focus:border-red-600 outline-none"
                                                />
                                            </div>
                                        </div>
                                        
                                        <button
                                            type="submit"
                                            disabled={reportando}
                                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors uppercase tracking-widest text-sm clip-tatico"
                                        >
                                            {reportando ? 'Confirmando...' : 'Confirmar Vitória'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center animate-pulse mb-4">
                                            <Flag className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Partida em Andamento</h3>
                                        <p className="text-zinc-400 max-w-sm">Os times já definiram o mapa e estão jogando. O organizador reportará o placar assim que a partida acabar.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ESTADO 4: FINALIZADA */}
                        {partida.time_b_id && partida.status === 'finalizada' && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <Shield className="w-12 h-12 text-zinc-700 mb-4" />
                                <h3 className="text-xl font-bold text-zinc-300">Partida Encerrada</h3>
                                <p className="text-zinc-500 text-sm mt-2 max-w-md">O time <strong>{partida.vencedor_nome}</strong> venceu o confronto e avançou na chave do torneio.</p>
                            </div>
                        )}

                    </div>
                </div>

                {/* DIREITA - CHAT DA SALA */}
                <div className="w-full lg:w-80 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-zinc-400" />
                        <span className="font-bold uppercase tracking-widest text-xs text-zinc-300">Lobby Chat</span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-zinc-800">
                        {partida.mensagens?.length === 0 ? (
                            <div className="m-auto text-center text-zinc-600 text-sm">
                                <p>Nenhuma mensagem ainda.</p>
                                <p className="text-xs mt-1">Combine com o time adversário!</p>
                            </div>
                        ) : (
                            partida.mensagens?.map((msg: any) => {
                                const isMe = msg.usuario_id === usuario?.id;
                                const isSystem = msg.usuario_nome === 'SISTEMA';
                                
                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="text-center my-2">
                                            <span className="inline-block bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">
                                                {msg.mensagem}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <span className="text-[10px] text-zinc-500 mb-0.5">{msg.usuario_nome}</span>
                                        <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${
                                            isMe 
                                                ? 'bg-red-600 text-white rounded-tr-sm' 
                                                : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
                                        }`}>
                                            {msg.mensagem}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <form onSubmit={handleEnviarMsg} className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2">
                        <input
                            type="text"
                            value={chatMsg}
                            onChange={e => setChatMsg(e.target.value)}
                            placeholder={usuario ? "Mensagem no lobby..." : "Faça login para digitar"}
                            disabled={!usuario}
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!chatMsg.trim() || !usuario}
                            className="w-10 h-10 shrink-0 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
