'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { TacticalInput } from '@/components/ui/TacticalInput';
import { TacticalButton } from '@/components/ui/TacticalButton';
import api from '@/lib/api';

export default function Cadastro() {
    const [form, setForm] = useState({ nome: '', email: '', senha: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/usuarios/cadastro', form);
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            window.dispatchEvent(new Event('localStorageChange'));
            toast.success('Conta criada! Bem-vindo à arena 🎯');
            router.push('/perfil');
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao cadastrar');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-57px)] grid grid-cols-1 lg:grid-cols-2">
            {/* ── Left panel ─── */}
            <div className="hidden lg:flex relative overflow-hidden bg-zinc-950 items-center justify-center border-r border-zinc-800/50">
                <div className="absolute inset-0">
                    <img 
                        src="/bg-auth.png" 
                        alt="Valorant Heroes" 
                        className="absolute w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 scanlines opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 to-transparent" />
                </div>

                <div className="relative z-10 text-center px-12 max-w-sm">
                    <p
                        className="text-red-500 font-black text-6xl tracking-widest uppercase mb-4"
                        style={{ fontFamily: 'var(--font-chakra), sans-serif' }}
                    >
                        V<span className="text-white">Tourney</span>
                    </p>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Sua jornada começa aqui.<br />
                        <span className="text-zinc-500 text-base">Crie sua conta e entre na arena.</span>
                    </p>

                    <div className="mt-10 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-red-600/40" />
                        <span className="text-red-500 text-xl">✦</span>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-red-600/40" />
                    </div>

                    <ul className="mt-8 space-y-3 text-left">
                        {[
                            'Stats reais via Riot API',
                            'Crie e gerencie seu time',
                            'Entre em torneios competitivos',
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-3 text-sm text-zinc-400">
                                <span className="w-5 h-5 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-400 text-xs font-bold shrink-0">
                                    ✓
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
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
                        <h1 className="text-2xl font-black text-white mb-1">Criar conta</h1>
                        <p className="text-zinc-500 text-sm">Junte-se à plataforma gratuitamente</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <TacticalInput
                            id="cadastro-nome"
                            type="text"
                            label="Nome"
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            placeholder="Seu nome"
                            required
                        />

                        <TacticalInput
                            id="cadastro-email"
                            type="email"
                            label="Email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="seu@email.com"
                            required
                        />

                        <TacticalInput
                            id="cadastro-senha"
                            type="password"
                            label="Senha"
                            value={form.senha}
                            onChange={(e) => setForm({ ...form, senha: e.target.value })}
                            placeholder="••••••••"
                            required
                        />


                        <TacticalButton
                            id="cadastro-submit"
                            type="submit"
                            loading={loading}
                        >
                            Criar conta
                        </TacticalButton>
                    </form>

                    <p className="text-center text-zinc-500 text-sm mt-6">
                        Já tem conta?{' '}
                        <Link href="/login" className="text-red-400 hover:text-red-300 font-medium">
                            Entrar
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
