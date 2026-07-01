'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import TimeCard from '@/components/TimeCard';
import Modal from '@/components/Modal';
import TournamentBracket from '@/components/TournamentBracket';
import ReactMarkdown from 'react-markdown';
import { Copy, CheckCircle2, Circle } from 'lucide-react';

interface Torneio {
    id: number;
    nome: string;
    descricao?: string;
    formato: string;
    max_times: number;
    status: string;
    organizador_id: number;
    organizador_nome?: string;
    data_inicio?: string | null;
    data_fim?: string | null;
    criado_em: string;
}

interface Inscricao {
    id: number;
    time_id: number;
    time_nome: string;
    time_tag?: string;
    status: string;
    inscrito_em: string;
}

interface Time {
    id: number;
    nome: string;
    tag?: string;
    capitao_id: number;
    capitao_nome: string;
    total_membros: number;
}

const formatoLabel: Record<string, string> = {
    eliminacao_simples: 'Eliminação simples',
    eliminacao_dupla: 'Eliminação dupla',
    pontos_corridos: 'Pontos corridos',
};

const inscricaoStatusColor: Record<string, string> = {
    pendente:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    aprovada:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    rejeitada: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function TorneioPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();

    const [torneio, setTorneio] = useState<Torneio | null>(null);
    const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
    const [meusTimes, setMeusTimes] = useState<Time[]>([]);
    const [partidas, setPartidas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTime, setSelectedTime] = useState<number | null>(null);
    const [inscrevendo, setInscrevendo] = useState(false);
    const [usuario, setUsuario] = useState<{ id: number; nome: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'inscricoes' | 'chaveamento'>('inscricoes');

    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (u) setUsuario(JSON.parse(u));
    }, []);

    useEffect(() => {
        if (!id) return;

        async function load() {
            try {
                const [torneioRes, inscricoesRes, partidasRes] = await Promise.all([
                    api.get(`/torneios/${id}`),
                    api.get(`/torneios/${id}/inscricoes`),
                    api.get(`/torneios/${id}/partidas`).catch(() => ({ data: [] }))
                ]);
                setTorneio(torneioRes.data);
                setInscricoes(inscricoesRes.data);
                setPartidas(partidasRes.data);
            } catch {
                toast.error('Torneio não encontrado');
                router.push('/');
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id]);

    async function openModal() {
        if (!usuario) { router.push('/login'); return; }
        try {
            const { data } = await api.get('/times');
            const meus = (data as Time[]).filter((t) => t.capitao_id === usuario.id);
            setMeusTimes(meus);
        } catch {
            toast.error('Erro ao buscar seus times');
            return;
        }
        setModalOpen(true);
    }

    async function inscreverTime() {
        if (!selectedTime) { toast.error('Selecione um time'); return; }
        setInscrevendo(true);
        try {
            await api.post(`/torneios/${id}/inscricoes`, { time_id: selectedTime });
            toast.success('Inscrição realizada! Aguardando aprovação 🎯');
            setModalOpen(false);
            // Refresh inscricoes
            const { data } = await api.get(`/torneios/${id}/inscricoes`);
            setInscricoes(data);
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao inscrever time');
        } finally {
            setInscrevendo(false);
        }
    }

    async function gerarBracket() {
        try {
            await api.post(`/torneios/${id}/partidas/gerar-bracket`);
            toast.success('Chaveamento gerado com sucesso! 🏆');
            const { data } = await api.get(`/torneios/${id}/partidas`);
            setPartidas(data);
            
            // Atualiza status do torneio localmente
            if (torneio) setTorneio({ ...torneio, status: 'em_andamento' });
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao gerar chaveamento');
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="skeleton h-8 w-64 rounded mb-4" />
                <div className="skeleton h-4 w-40 rounded mb-8" />
                <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (!torneio) return null;

    const aprovados = inscricoes.filter((i) => i.status === 'aprovada');
    const pct = Math.round((aprovados.length / torneio.max_times) * 100);
    const isOrganizer = usuario?.id === torneio.organizador_id;

    const getCountdown = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'A definir';
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        if (diff <= 0) return 'Iniciado';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        if (days > 0) return `Em ${days}d ${hours}h`;
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        return `Em ${hours}h ${minutes}m`;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-zinc-600 mb-6">
                <Link href="/" className="hover:text-zinc-400 transition-colors">Torneios</Link>
                <span>/</span>
                <span className="text-zinc-400">{torneio.nome}</span>
            </div>

            {/* Header */}
            <motion.div
                className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <p className="text-red-400 text-xs font-bold tracking-[0.3em] uppercase">
                                    Torneio #{torneio.id}
                                </p>
                                {isOrganizer && (
                                    <button 
                                        onClick={() => router.push(`/torneios/criar?clone=${torneio.id}`)}
                                        className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-[10px] uppercase font-bold tracking-wider"
                                        title="Duplicar torneio (Item 126)"
                                    >
                                        <Copy size={12} /> Duplicar
                                    </button>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                                {torneio.nome}
                            </h1>
                        </div>
                        <StatusBadge status={torneio.status} />
                    </div>

                    {torneio.descricao && (
                        <div className="text-zinc-400 text-sm mb-6 max-w-2xl prose prose-invert prose-p:leading-relaxed prose-a:text-red-400">
                            {/* Render Markdown (Item 128) */}
                            <ReactMarkdown>{torneio.descricao}</ReactMarkdown>
                        </div>
                    )}

                    {/* Info grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Formato', value: formatoLabel[torneio.formato] ?? torneio.formato },
                            { label: 'Organizador', value: torneio.organizador_nome ?? '—' },
                            { label: 'Times', value: `${aprovados.length} / ${torneio.max_times}` },
                            { 
                                label: 'Início', 
                                value: torneio.data_inicio ? new Date(torneio.data_inicio).toLocaleDateString('pt-BR') : 'A definir',
                                highlight: getCountdown(torneio.data_inicio) // Contagem regressiva (Item 129)
                            },
                        ].map((info) => (
                            <div key={info.label} className="bg-zinc-800/50 rounded-xl p-3 flex flex-col justify-between">
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{info.label}</p>
                                <div>
                                    <p className="text-white font-semibold text-sm">{info.value}</p>
                                    {info.highlight && info.highlight !== 'Iniciado' && info.highlight !== 'A definir' && (
                                        <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1">{info.highlight}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Capacity bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                            <span>Capacidade</span>
                            <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Checklist Organizador (Item 127) */}
                    {isOrganizer && (torneio.status === 'criado' || torneio.status === 'inscricoes_abertas') && (
                        <div className="mb-6 bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl">
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-3">Checklist de Início</p>
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                <div className="flex items-center gap-2 text-sm">
                                    {aprovados.length >= 2 ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-zinc-600" />}
                                    <span className={aprovados.length >= 2 ? 'text-zinc-300' : 'text-zinc-500'}>Times confirmados ({aprovados.length}/2 mín)</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    {torneio.data_inicio ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-zinc-600" />}
                                    <span className={torneio.data_inicio ? 'text-zinc-300' : 'text-zinc-500'}>Horário definido</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    {torneio.descricao ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-zinc-600" />}
                                    <span className={torneio.descricao ? 'text-zinc-300' : 'text-zinc-500'}>Regras publicadas</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    {torneio.status === 'inscricoes_abertas' && (
                        <button
                            id="btn-inscrever-time"
                            onClick={openModal}
                            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-red-900/30 hover:scale-105 active:scale-95"
                        >
                            Inscrever meu time →
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800 mb-6 gap-6">
                <button
                    onClick={() => setActiveTab('inscricoes')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative ${
                        activeTab === 'inscricoes' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    Times Inscritos ({inscricoes.length})
                    {activeTab === 'inscricoes' && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('chaveamento')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative ${
                        activeTab === 'chaveamento' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    Chaveamento
                    {activeTab === 'chaveamento' && (
                        <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'inscricoes' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {inscricoes.length === 0 ? (
                            <div className="border border-dashed border-zinc-800 rounded-xl p-10 text-center">
                                <p className="text-3xl mb-3">🏆</p>
                                <p className="text-zinc-500">Nenhum time inscrito ainda.</p>
                            </div>
                        ) : (
                            <motion.div
                                className="space-y-3"
                                initial="hidden"
                                animate="visible"
                                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                            >
                                {inscricoes.map((insc) => (
                                    <motion.div
                                        key={insc.id}
                                        variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3 } } }}
                                        className="flex items-center justify-between border border-zinc-800 rounded-xl px-4 py-3 bg-zinc-900/60"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-black text-white">
                                                {(insc.time_tag ?? insc.time_nome).slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-sm">{insc.time_nome}</p>
                                                {insc.time_tag && (
                                                    <p className="text-xs text-zinc-500 font-mono">#{insc.time_tag}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${inscricaoStatusColor[insc.status] ?? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'}`}>
                                            {insc.status}
                                        </span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'chaveamento' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {partidas.length === 0 ? (
                            <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center">
                                <p className="text-zinc-500 mb-4">O chaveamento deste torneio ainda não foi gerado.</p>
                                {usuario?.id === torneio?.organizador_id && torneio?.status === 'inscricoes_abertas' && (
                                    <button
                                        onClick={gerarBracket}
                                        disabled={inscricoes.filter(i => i.status === 'aprovada').length < 2}
                                        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Gerar Bracket
                                    </button>
                                )}
                                {usuario?.id === torneio?.organizador_id && inscricoes.filter(i => i.status === 'aprovada').length < 2 && (
                                    <p className="text-xs text-red-400 mt-2">É necessário pelo menos 2 times aprovados.</p>
                                )}
                            </div>
                        ) : (
                            <TournamentBracket rounds={[
                                {
                                    title: 'Primeira Fase',
                                    matches: partidas.map(p => ({
                                        id: p.id.toString(),
                                        nextMatchId: null, // TODO: próxima fase
                                        status: p.status === 'agendada' ? 'pending' : (p.status === 'finalizada' ? 'finished' : 'live'),
                                        team1: p.time_a_id ? { id: p.time_a_id.toString(), name: p.time_a_nome, score: p.placar_a, isWinner: p.vencedor_id === p.time_a_id } : null,
                                        team2: p.time_b_id ? { id: p.time_b_id.toString(), name: p.time_b_nome, score: p.placar_b, isWinner: p.vencedor_id === p.time_b_id } : null
                                    }))
                                }
                            ]} />
                        )}
                    </motion.div>
                )}
            </div>

            {/* Modal de inscrição */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Inscrever meu time">
                {meusTimes.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-3xl mb-3">🛡</p>
                        <p className="text-zinc-400 mb-1 font-medium">Você não tem times como capitão.</p>
                        <p className="text-zinc-600 text-sm mb-4">
                            Crie um time primeiro para poder participar.
                        </p>
                        <Link
                            href="/times/criar"
                            className="inline-block bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors"
                        >
                            Criar time
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-zinc-400 text-sm mb-4">
                            Selecione o time que deseja inscrever:
                        </p>
                        <div className="space-y-2 mb-5 max-h-60 overflow-y-auto pr-1">
                            {meusTimes.map((t) => (
                                <TimeCard
                                    key={t.id}
                                    {...t}
                                    selected={selectedTime === t.id}
                                    onClick={() => setSelectedTime(t.id)}
                                />
                            ))}
                        </div>
                        <button
                            id="btn-confirmar-inscricao"
                            onClick={inscreverTime}
                            disabled={!selectedTime || inscrevendo}
                            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {inscrevendo ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Inscrevendo...
                                </span>
                            ) : (
                                'Confirmar inscrição'
                            )}
                        </button>
                    </>
                )}
            </Modal>
        </div>
    );
}
