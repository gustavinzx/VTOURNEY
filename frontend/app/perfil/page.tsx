'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import api from '@/lib/api';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { AnimatedList, AnimatedListItem } from '@/components/ui/AnimatedList';
import ShinyText from '@/components/ui/ShinyText';
import AvatarUpload from '@/components/AvatarUpload';
import { Swords, Target, ShieldCheck, Zap, Crown } from 'lucide-react';

interface Stats {
    rank_atual: string;
    kd_ratio: string;
    win_rate: string;
    headshot_pct: string;
    partidas_analisadas: number;
    atualizado_em: string;
    badges?: {
        first_blood: boolean;
        clutch_master: boolean;
        flawless: boolean;
        ace: boolean;
        top_fragger: boolean;
    };
}

import Modal from '@/components/Modal';

interface Usuario {
    id: number;
    nome: string;
    email: string;
    riot_id: string;
    tipo: string;
    avatar_url?: string;
    banner_preset?: number;
}

// Rank tier configuration
const rankConfig: Record<string, { color: string; bg: string; border: string; glow: string; shiny: boolean }> = {
    Iron:      { color: '#6b7280', bg: '#1c1c1e', border: '#6b7280/30', glow: 'rgba(107,114,128,0.2)', shiny: false },
    Bronze:    { color: '#92400e', bg: '#1c1209', border: '#92400e/30', glow: 'rgba(146,64,14,0.25)',  shiny: false },
    Silver:    { color: '#9ca3af', bg: '#1a1a1c', border: '#9ca3af/30', glow: 'rgba(156,163,175,0.2)', shiny: false },
    Gold:      { color: '#f59e0b', bg: '#1c1804', border: '#f59e0b/30', glow: 'rgba(245,158,11,0.25)', shiny: true  },
    Platinum:  { color: '#06b6d4', bg: '#041619', border: '#06b6d4/30', glow: 'rgba(6,182,212,0.25)',  shiny: true  },
    Diamond:   { color: '#8b5cf6', bg: '#100a1c', border: '#8b5cf6/30', glow: 'rgba(139,92,246,0.25)', shiny: true  },
    Ascendant: { color: '#10b981', bg: '#041510', border: '#10b981/30', glow: 'rgba(16,185,129,0.25)', shiny: true  },
    Immortal:  { color: '#ef4444', bg: '#1c0404', border: '#ef4444/30', glow: 'rgba(239,68,68,0.25)',  shiny: true  },
    Radiant:   { color: '#fbbf24', bg: '#1c1502', border: '#fbbf24/30', glow: 'rgba(251,191,36,0.3)',  shiny: true  },
};

function getRankTier(rankString: string): string {
    for (const tier of Object.keys(rankConfig)) {
        if (rankString.toLowerCase().includes(tier.toLowerCase())) return tier;
    }
    return 'Iron';
}

const BANNER_PRESETS = [
    { name: 'Rank Default', bg: (rc: any) => `linear-gradient(135deg, ${rc.bg} 0%, #09090b 60%)` },
    { name: 'Red',          bg: () => `linear-gradient(135deg, #7f1d1d 0%, #09090b 60%)` },
    { name: 'Blue',         bg: () => `linear-gradient(135deg, #1e3a8a 0%, #09090b 60%)` },
    { name: 'Green',        bg: () => `linear-gradient(135deg, #14532d 0%, #09090b 60%)` },
    { name: 'Purple',       bg: () => `linear-gradient(135deg, #4c1d95 0%, #09090b 60%)` },
    { name: 'Pink',         bg: () => `linear-gradient(135deg, #831843 0%, #09090b 60%)` },
    { name: 'Orange',       bg: () => `linear-gradient(135deg, #78350f 0%, #09090b 60%)` },
    { name: 'Gray',         bg: () => `linear-gradient(135deg, #27272a 0%, #09090b 60%)` },
];

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
    }),
};

const BADGE_ICONS: Record<string, React.ElementType> = {
    first_blood: Swords,
    clutch_master: Target,
    flawless: ShieldCheck,
    ace: Zap,
    top_fragger: Crown,
};

const DUMMY_BADGES = [
    { id: 1, badgeKey: 'first_blood', name: 'First Blood', unlocked: true },
    { id: 2, badgeKey: 'clutch_master', name: 'Clutch Master', unlocked: true },
    { id: 3, badgeKey: 'flawless', name: 'Flawless', unlocked: false },
    { id: 4, badgeKey: 'ace', name: 'Ace', unlocked: false },
    { id: 5, badgeKey: 'top_fragger', name: 'Top Fragger', unlocked: true },
];

export default function Perfil() {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    const [stats, setStats] = useState<Stats | null>(null);
    const [atualizando, setAtualizando] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ nome: '', riot_id: '' });
    const [salvando, setSalvando] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const router = useRouter();

    const { data: usuarioApi, mutate: mutateUsuario } = useSWR('/usuarios/me', fetcher);
    
    // Merge de dados (localStorage + SWR)
    const currentUser = usuarioApi || usuario;
    
    const { data: statsApi, isLoading: loadingStats } = useSWR(
        currentUser?.id ? `/stats/${currentUser.id}` : null,
        fetcher
    );
    
    const currentStats = statsApi || stats;

    async function handleAvatarSuccess(url: string) {
        setAvatarUrl(url);
        // Atualiza o localStorage para que o Navbar também reflita
        const stored = localStorage.getItem('usuario');
        if (stored) {
            const parsed = JSON.parse(stored);
            const u = parsed.usuario || parsed;
            const updatedUser = { ...u, avatar_url: url };
            localStorage.setItem('usuario', JSON.stringify(updatedUser));
            setUsuario(updatedUser);
            window.dispatchEvent(new Event('localStorageChange'));
        }
        try {
            await api.put('/usuarios/me', { avatar_url: url });
        } catch (e) {
            console.error('Erro ao salvar avatar no banco:', e);
        }
    }

    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (!u) { router.push('/login'); return; }
        const parsed = JSON.parse(u);
        const userObj = parsed.usuario || parsed;
        
        if (!userObj.id) {
            localStorage.removeItem('usuario');
            localStorage.removeItem('token');
            router.push('/login');
            return;
        }

        setUsuario(userObj);
        setAvatarUrl(userObj.avatar_url);
        // SWR takes over the stats and user fetching
    }, []);



    async function changeBanner() {
        if (!currentUser) return;
        const nextPreset = ((currentUser.banner_preset ?? 0) + 1) % BANNER_PRESETS.length;
        
        // Optimistic update
        mutateUsuario({ ...currentUser, banner_preset: nextPreset }, false);
        setUsuario({ ...currentUser, banner_preset: nextPreset });
        
        try {
            await api.put('/usuarios/me', { banner_preset: nextPreset });
            mutateUsuario();
            toast.success('Banner atualizado!');
        } catch (err: any) {
            toast.error('Erro ao atualizar banner');
            // Revert on error
            mutateUsuario();
        }
    }

    async function atualizarStats() {
        if (!usuario) return;
        if (!usuario.riot_id) {
            toast.error('Preencha seu Riot ID (Nome#Tag) primeiro editando o perfil.');
            return;
        }
        setAtualizando(true);
        try {
            const { data } = await api.post(`/stats/atualizar/${usuario.id}`, {
                riot_id: usuario.riot_id  // fallback quando o DB não está disponível
            });
            setStats(data.stats);
            localStorage.setItem(`stats_${usuario.id}`, JSON.stringify(data.stats));
            toast.success('Stats atualizadas com sucesso!');
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao atualizar stats');
        } finally {
            setAtualizando(false);
        }
    }

    async function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSalvando(true);
        try {
            await api.put('/usuarios/me', editForm);
            if (usuario) {
                const updatedUser = { ...usuario, nome: editForm.nome, riot_id: editForm.riot_id };
                setUsuario(updatedUser);
                localStorage.setItem('usuario', JSON.stringify(updatedUser));
            }
            toast.success('Perfil atualizado!');
            setShowEditModal(false);
        } catch (err: any) {
            toast.error('Erro ao atualizar perfil');
        } finally {
            setSalvando(false);
        }
    }

    function openEditModal() {
        if (usuario) {
            setEditForm({ nome: usuario.nome, riot_id: usuario.riot_id || '' });
            setShowEditModal(true);
        }
    }

    if (!usuario) return null;

    const tier = stats ? getRankTier(stats.rank_atual) : 'Iron';
    const rc = rankConfig[tier] ?? rankConfig.Iron;

    const chartData = stats
        ? [
              { name: 'Win Rate', value: parseFloat(stats.win_rate), fill: '#ef4444' },
              { name: 'HS%', value: parseFloat(stats.headshot_pct), fill: '#f97316' },
          ]
        : [];

    const statCards = stats
        ? [
              { label: 'K/D Ratio',   value: parseFloat(stats.kd_ratio),     decimals: 2, suffix: '' },
              { label: 'Win Rate',    value: parseFloat(stats.win_rate),      decimals: 1, suffix: '%' },
              { label: 'Headshot %', value: parseFloat(stats.headshot_pct),   decimals: 1, suffix: '%' },
              { label: 'Partidas',   value: stats.partidas_analisadas,         decimals: 0, suffix: '' },
          ]
        : [];

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            {/* ── Profile header banner ─── */}
            <motion.div
                className="relative rounded-2xl overflow-hidden mb-8 border"
                style={{
                    borderColor: `${rc.color}30`,
                    boxShadow: `0 0 40px ${rc.glow}`,
                }}
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Banner gradient */}
                <div
                    className="absolute inset-0 transition-colors duration-500"
                    style={{
                        background: BANNER_PRESETS[usuario.banner_preset ?? 0].bg(rc),
                    }}
                />
                {/* Subtle grid */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
                {/* Glow orb */}
                <div
                    className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-30 blur-3xl"
                    style={{ background: rc.color }}
                />

                <div className="relative z-10 p-6 md:p-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {/* Avatar — clicável para upload */}
                        <AvatarUpload
                            currentUrl={avatarUrl}
                            displayName={usuario.nome}
                            onSuccess={handleAvatarSuccess}
                        />

                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <p className="text-zinc-500 text-xs font-bold tracking-[0.25em] uppercase">
                                    Perfil
                                </p>
                                <button
                                    onClick={changeBanner}
                                    title="Mudar banner"
                                    className="w-5 h-5 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center hover:border-red-500 hover:text-red-400 transition-colors text-[10px] text-zinc-500"
                                >
                                    🎨
                                </button>
                            </div>
                            <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                                {usuario.nome}
                            </h1>
                            {usuario.riot_id && (
                                <p className="text-zinc-400 mt-0.5 font-mono text-sm">{usuario.riot_id}</p>
                            )}
                            <span className="mt-1 inline-block text-xs bg-zinc-800/60 text-zinc-400 px-2 py-0.5 rounded-md uppercase tracking-wider border border-zinc-700/50">
                                {usuario.tipo}
                            </span>

                            {/* Rank badge */}
                            {stats && (
                                <div className="mt-2">
                                    {rc.shiny ? (
                                        <ShinyText
                                            text={stats.rank_atual}
                                            className="text-sm font-black uppercase tracking-wider"
                                            speed={2}
                                        />
                                    ) : (
                                        <span
                                            className="text-sm font-black uppercase tracking-wider"
                                            style={{ color: rc.color }}
                                        >
                                            {stats.rank_atual}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sm:self-start flex items-center gap-2">
                        {stats && (
                            <Link
                                href="/perfil/card"
                                className="bg-[var(--bg-surface)] border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-4 py-2.5 clip-tatico text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 whitespace-nowrap"
                            >
                                🎴 Rank Card
                            </Link>
                        )}
                        <button
                            onClick={openEditModal}
                            className="bg-[var(--bg-surface)] border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-4 py-2.5 clip-tatico text-sm font-bold uppercase tracking-wider transition-colors"
                        >
                            Editar
                        </button>
                        <button
                            onClick={atualizarStats}
                            disabled={atualizando}
                            className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 clip-tatico font-bold uppercase tracking-wider text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            {atualizando ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    SYNCING...
                                </>
                            ) : (
                                <>↻ Sincronizar Combat Record</>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* ── Stats ─── */}
            {loadingStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton h-24 rounded-xl" />
                    ))}
                </div>
            ) : stats ? (
                <>
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {statCards.map((s, i) => (
                            <motion.div
                                key={s.label}
                                custom={i}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-colors"
                            >
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">{s.label}</p>
                                <p className="text-2xl font-black text-white">
                                    <AnimatedCounter
                                        value={s.value}
                                        decimals={s.decimals}
                                        suffix={s.suffix}
                                        duration={1.2}
                                    />
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Chart */}
                    <motion.div
                        className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                    >
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6">
                            Performance visual — {stats.partidas_analisadas} partidas
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                            <div className="w-44 h-44 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        cx="50%" cy="50%"
                                        innerRadius="40%" outerRadius="90%"
                                        data={chartData}
                                        startAngle={90} endAngle={-270}
                                    >
                                        <RadialBar dataKey="value" cornerRadius={4} />
                                        <Tooltip
                                            formatter={(v: any) => `${v}%`}
                                            contentStyle={{
                                                background: '#18181b',
                                                border: '1px solid #3f3f46',
                                                borderRadius: 8,
                                            }}
                                            labelStyle={{ color: '#a1a1aa' }}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                                    <span className="text-zinc-400 text-sm">
                                        Win Rate:{' '}
                                        <strong className="text-white">{stats.win_rate}%</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                                    <span className="text-zinc-400 text-sm">
                                        Headshot %:{' '}
                                        <strong className="text-white">{stats.headshot_pct}%</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: rc.color }} />
                                    <span className="text-zinc-400 text-sm">
                                        K/D Ratio:{' '}
                                        <strong className="text-white">{stats.kd_ratio}</strong>
                                    </span>
                                </div>
                                {stats.atualizado_em && (
                                    <p className="text-zinc-600 text-xs pt-2 border-t border-zinc-800">
                                        Atualizado em{' '}
                                        {new Date(stats.atualizado_em.replace(' ', 'T')).toLocaleDateString('pt-BR', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                        })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Badges Section */}
                    <motion.div
                        className="mt-8"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                    >
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-600 rounded-full" />
                            Badges & Conquistas
                        </h2>
                        
                        <AnimatedList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {DUMMY_BADGES.map(badge => {
                                const Icon = BADGE_ICONS[badge.badgeKey] || Zap;
                                const unlocked = stats.badges ? stats.badges[badge.badgeKey as keyof typeof stats.badges] : badge.unlocked;
                                return (
                                    <AnimatedListItem 
                                        key={badge.id}
                                        className={`badge-card relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-4 p-4 transition-all duration-300 border ${
                                            unlocked 
                                                ? 'unlocked bg-zinc-900/80 border-zinc-700 hover:border-red-500 hover:bg-zinc-800' 
                                                : 'locked bg-zinc-900/30 border-zinc-800/50'
                                        }`}
                                    >
                                        <div className="badge-icon-frame">
                                            <Icon size={28} strokeWidth={1.5} />
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking-wider text-center ${unlocked ? 'text-white' : 'text-zinc-500'}`}>
                                            {badge.name}
                                        </span>
                                    </AnimatedListItem>
                                );
                            })}
                        </AnimatedList>
                    </motion.div>
                </>
            ) : (
                <motion.div
                    className="border border-dashed border-zinc-800 rounded-2xl p-14 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-4xl mb-4">📊</p>
                    <p className="text-zinc-400 font-medium mb-1">
                        {usuario.riot_id
                            ? 'Nenhuma stat encontrada.'
                            : 'Adicione seu Riot ID para ver suas estatísticas.'}
                    </p>
                    {usuario.riot_id && (
                        <p className="text-zinc-600 text-sm">
                            Clique em "Atualizar Stats" para buscar seus dados da Riot.
                        </p>
                    )}
                </motion.div>
            )}
            {/* Edit Modal */}
            <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Perfil">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider text-zinc-400 mb-1">Nome</label>
                        <input
                            type="text"
                            required
                            value={editForm.nome}
                            onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                            className="w-full bg-[var(--bg-surface)] border border-zinc-700 text-white rounded p-3 focus:outline-none focus:border-red-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider text-zinc-400 mb-1">Riot ID</label>
                        <input
                            type="text"
                            placeholder="Ex: TenZ#NA1"
                            value={editForm.riot_id}
                            onChange={(e) => setEditForm({ ...editForm, riot_id: e.target.value })}
                            className="w-full bg-[var(--bg-surface)] border border-zinc-700 text-white rounded p-3 focus:outline-none focus:border-red-500 transition-colors font-mono"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Obrigatório para sincronizar stats.</p>
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={salvando}
                            className="w-full bg-red-600 text-white font-bold py-3 px-4 clip-tatico hover:bg-red-500 transition-colors disabled:opacity-50 uppercase tracking-widest text-sm"
                        >
                            {salvando ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
