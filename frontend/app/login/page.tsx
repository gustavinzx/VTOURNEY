'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { TacticalInput } from '@/components/ui/TacticalInput';
import { TacticalButton } from '@/components/ui/TacticalButton';
import api from '@/lib/api';
import { motion } from 'framer-motion';

export default function Login() {
    const [form, setForm] = useState({ email: '', senha: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/usuarios/login', form);
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            toast.success('Bem-vindo de volta! 🎯');
            router.push('/perfil');
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-57px)] grid grid-cols-1 lg:grid-cols-2">
            {/* ── Left panel ─── */}
            <div className="hidden lg:flex relative overflow-hidden bg-[var(--bg-base)] items-center justify-center border-r border-zinc-800/50">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 scanlines opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 to-transparent" />
                    {/* Grid */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
                        }}
                    />
                </div>

                <div className="relative z-10 text-center px-12 max-w-sm">
                    <p
                        className="text-red-500 font-black text-6xl tracking-widest uppercase mb-4"
                        style={{ fontFamily: 'var(--font-chakra), sans-serif' }}
                    >
                        V<span className="text-white">Tourney</span>
                    </p>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        A arena te espera.<br />
                        <span className="text-zinc-500 text-base">Entre e mostre quem você é.</span>
                    </p>

                    {/* Decorative line */}
                    <div className="mt-10 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-red-600/40" />
                        <span className="text-red-500 text-xl">✦</span>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-red-600/40" />
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                        {[
                            { emoji: '⚔', label: 'Torneios' },
                            { emoji: '🎯', label: 'Stats' },
                            { emoji: '🏆', label: 'Ranking' },
                        ].map((f) => (
                            <div key={f.label} className="bg-zinc-800/40 rounded-xl p-3 border border-zinc-700/30">
                                <p className="text-2xl mb-1">{f.emoji}</p>
                                <p className="text-xs text-zinc-400">{f.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right panel (form) ─── */}
            <div className="flex items-center justify-center px-6 py-12 bg-zinc-950">
                <motion.div
                    className="w-full max-w-sm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' as const }}
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <span
                            className="text-red-500 font-black text-3xl tracking-widest uppercase"
                            style={{ fontFamily: 'var(--font-chakra), sans-serif' }}
                        >
                            V<span className="text-white">Tourney</span>
                        </span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-white mb-1">Entrar</h1>
                        <p className="text-zinc-500 text-sm">Acesse sua conta para competir</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <TacticalInput
                            id="login-email"
                            type="email"
                            label="Email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="seu@email.com"
                            required
                        />

                        <TacticalInput
                            id="login-senha"
                            type="password"
                            label="Senha"
                            value={form.senha}
                            onChange={(e) => setForm({ ...form, senha: e.target.value })}
                            placeholder="••••••••"
                            required
                        />

                        <TacticalButton
                            id="login-submit"
                            type="submit"
                            loading={loading}
                            className="mt-2"
                        >
                            Entrar
                        </TacticalButton>
                    </form>

                    <p className="text-center text-zinc-500 text-sm mt-6">
                        Não tem conta?{' '}
                        <Link href="/cadastro" className="text-red-400 hover:text-red-300 font-medium">
                            Cadastre-se grátis
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
