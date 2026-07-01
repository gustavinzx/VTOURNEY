'use client';

import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Stats {
    rank_atual: string;
    kd_ratio: string;
    win_rate: string;
    headshot_pct: string;
    partidas_analisadas: number;
}

interface Usuario {
    id: number;
    nome: string;
    riot_id: string;
    avatar_url?: string;
}

// Rank tier → visual config
const rankStyle: Record<string, { bg: string; accent: string; glow: string; tier: string }> = {
    Iron:      { bg: 'from-zinc-900 to-zinc-800',            accent: '#71717a', glow: 'rgba(113,113,122,0.4)',   tier: 'I'  },
    Bronze:    { bg: 'from-orange-950 to-zinc-900',          accent: '#92400e', glow: 'rgba(146,64,14,0.5)',    tier: 'B'  },
    Silver:    { bg: 'from-zinc-800 to-zinc-900',            accent: '#a1a1aa', glow: 'rgba(161,161,170,0.4)',  tier: 'S'  },
    Gold:      { bg: 'from-yellow-950 to-zinc-900',          accent: '#f59e0b', glow: 'rgba(245,158,11,0.5)',   tier: 'G'  },
    Platinum:  { bg: 'from-cyan-950 to-zinc-900',            accent: '#06b6d4', glow: 'rgba(6,182,212,0.5)',    tier: 'P'  },
    Diamond:   { bg: 'from-violet-950 to-zinc-900',          accent: '#8b5cf6', glow: 'rgba(139,92,246,0.5)',   tier: 'D'  },
    Ascendant: { bg: 'from-emerald-950 to-zinc-900',         accent: '#10b981', glow: 'rgba(16,185,129,0.5)',   tier: 'A'  },
    Immortal:  { bg: 'from-red-950 to-zinc-900',             accent: '#ef4444', glow: 'rgba(239,68,68,0.5)',    tier: 'IM' },
    Radiant:   { bg: 'from-yellow-900 via-orange-950 to-zinc-900', accent: '#fbbf24', glow: 'rgba(251,191,36,0.6)', tier: 'R' },
};

function getRankTier(rankStr: string): string {
    for (const tier of Object.keys(rankStyle)) {
        if (rankStr.toLowerCase().includes(tier.toLowerCase())) return tier;
    }
    return 'Iron';
}

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

// Stat bar component (rendered inline as inline-block)
function StatBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
        </div>
    );
}

export default function RankCardPage() {
    const cardRef = useRef<HTMLDivElement>(null);
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (!u) { router.push('/login'); return; }
        const parsed = JSON.parse(u);
        const userObj: Usuario = parsed.usuario || parsed;
        
        if (!userObj.id) {
            localStorage.removeItem('usuario');
            localStorage.removeItem('token');
            router.push('/login');
            return;
        }

        setUsuario(userObj);
        api.get(`/stats/${userObj.id}`)
            .then(r => setStats(r.data))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, []);

    async function exportar() {
        if (!cardRef.current) return;
        setExporting(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2, // double resolution for sharpness
                backgroundColor: '#09090b',
            });
            const link = document.createElement('a');
            link.download = `vtourney-card-${usuario?.nome?.replace(/\s+/g, '-') ?? 'rank'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error(e);
        } finally {
            setExporting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="skeleton w-[600px] h-[300px] rounded-2xl" />
            </div>
        );
    }

    if (!stats || !usuario) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
                <p className="text-4xl">📊</p>
                <p className="text-zinc-400">Atualize suas stats no perfil primeiro.</p>
                <button onClick={() => router.push('/perfil')}
                    className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 clip-tatico text-sm font-bold uppercase tracking-wider transition-colors">
                    Ir para perfil
                </button>
            </div>
        );
    }

    const tier = getRankTier(stats.rank_atual);
    const rs = rankStyle[tier];

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="mb-8">
                <p className="text-red-400 text-xs font-bold tracking-[0.3em] uppercase mb-2">Compartilhar</p>
                <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                    Rank Card
                </h1>
                <p className="text-zinc-500 text-sm mt-1">Exporte seu card de player para compartilhar nas redes.</p>
            </div>

            {/* ── THE CARD (this is what gets exported) ── */}
            <div
                ref={cardRef}
                className="relative overflow-hidden rounded-2xl"
                style={{
                    width: 600,
                    height: 300,
                    background: '#09090b',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
            >
                {/* Background base */}
                <div style={{ position: 'absolute', inset: 0, background: '#0F1115' }} />

                {/* Scanlines layer */}
                <div
                    style={{
                        position: 'absolute', inset: 0, opacity: 0.5,
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)',
                    }}
                />

                {/* Tactical gradient accent */}
                <div
                    style={{
                        position: 'absolute', inset: 0,
                        background: `linear-gradient(135deg, ${rs.accent}15 0%, transparent 50%)`,
                    }}
                />

                {/* Grid pattern */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.1,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }} />

                {/* Top Right Chamfer overlay (to simulate clip-tatico in html-to-image) */}
                <div style={{
                    position: 'absolute', top: -20, right: -20, width: 40, height: 40,
                    background: '#09090b', transform: 'rotate(45deg)',
                }} />

                {/* Bottom Left Chamfer overlay */}
                <div style={{
                    position: 'absolute', bottom: -20, left: -20, width: 40, height: 40,
                    background: '#09090b', transform: 'rotate(45deg)',
                }} />

                {/* Glow orb */}
                <div style={{
                    position: 'absolute', top: -60, right: -60,
                    width: 240, height: 240, borderRadius: '50%',
                    background: rs.accent, opacity: 0.12,
                    filter: 'blur(60px)',
                }} />

                {/* Left accent bar */}
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: 4,
                    background: `linear-gradient(to bottom, ${rs.accent}, transparent)`,
                }} />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10, padding: '32px 36px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        {/* Identity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {/* Avatar */}
                            <div style={{
                                width: 64, height: 64,
                                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                                background: `linear-gradient(135deg, ${rs.accent}, ${rs.accent}60)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, fontWeight: 900, color: '#fff',
                                boxShadow: `0 8px 24px ${rs.glow}`,
                                flexShrink: 0,
                            }}>
                                {usuario.avatar_url
                                    ? <img src={usuario.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 16, objectFit: 'cover' }} />
                                    : getInitials(usuario.nome)
                                }
                            </div>

                            <div>
                                <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>
                                    {usuario.nome}
                                </div>
                                {usuario.riot_id && (
                                    <div style={{ color: '#71717a', fontSize: 12, fontFamily: 'monospace', marginTop: 2 }}>
                                        {usuario.riot_id}
                                    </div>
                                )}
                                <div style={{
                                    marginTop: 6, display: 'inline-block',
                                    background: `${rs.accent}20`, border: `1px solid ${rs.accent}40`,
                                    borderRadius: 6, padding: '2px 10px',
                                    color: rs.accent, fontSize: 11, fontWeight: 700,
                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                }}>
                                    {stats.rank_atual}
                                </div>
                            </div>
                        </div>

                        {/* Tier badge */}
                        <div style={{
                            width: 56, height: 56, borderRadius: 12,
                            background: `${rs.accent}15`, border: `2px solid ${rs.accent}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, fontWeight: 900, color: rs.accent,
                        }}>
                            {rs.tier}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        {[
                            { label: 'K/D Ratio', value: stats.kd_ratio, raw: parseFloat(stats.kd_ratio), max: 3, suffix: '' },
                            { label: 'Win Rate', value: `${stats.win_rate}%`, raw: parseFloat(stats.win_rate), max: 100, suffix: '' },
                            { label: 'HS%', value: `${stats.headshot_pct}%`, raw: parseFloat(stats.headshot_pct), max: 60, suffix: '' },
                            { label: 'Partidas', value: String(stats.partidas_analisadas), raw: stats.partidas_analisadas, max: 50, suffix: '' },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: 10, padding: '10px 12px',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <div style={{ color: '#52525b', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                                    {s.label}
                                </div>
                                <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>
                                    {s.value}
                                </div>
                                <div style={{ marginTop: 6 }}>
                                    <StatBar value={s.raw} max={s.max} color={rs.accent} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ color: '#3f3f46', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            vtourney.gg
                        </div>
                        <div style={{
                            color: '#dc2626', fontSize: 13, fontWeight: 900,
                            letterSpacing: '0.2em', textTransform: 'uppercase',
                        }}>
                            VTourney
                        </div>
                    </div>
                </div>
            </div>

            {/* Export button */}
            <div className="mt-6 flex gap-3">
                <button
                    id="btn-exportar-card"
                    onClick={exportar}
                    disabled={exporting}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-red-900/30 hover:scale-105 active:scale-95"
                >
                    {exporting ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Exportando...
                        </>
                    ) : (
                        <>↓ Baixar PNG</>
                    )}
                </button>
                <button
                    onClick={() => router.push('/perfil')}
                    className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                    ← Voltar ao perfil
                </button>
            </div>

            <p className="text-zinc-600 text-xs mt-4">
                A imagem é exportada em 2× de resolução (1200×600px) para ficar nítida nas redes sociais.
            </p>
        </div>
    );
}
