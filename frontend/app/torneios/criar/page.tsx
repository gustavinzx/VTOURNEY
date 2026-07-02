'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Trophy } from 'lucide-react';
import TorneioCard from '@/components/TorneioCard';
import { TacticalInput } from '@/components/ui/TacticalInput';
import { TacticalButton } from '@/components/ui/TacticalButton';

const formatos = [
    { value: 'eliminacao_simples', label: 'Eliminação simples', desc: 'Perde uma vez, está fora.' },
    { value: 'eliminacao_dupla',   label: 'Eliminação dupla',   desc: 'Perde duas vezes para sair.' },
    { value: 'pontos_corridos',    label: 'Pontos corridos',    desc: 'Todos jogam contra todos.' },
];

function CriarTorneioForm() {
    const [form, setForm] = useState({
        nome: '',
        descricao: '',
        formato: 'eliminacao_simples',
        max_times: 8,
    });
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    
    const searchParams = useSearchParams();
    const cloneId = searchParams.get('clone');

    useEffect(() => {
        if (cloneId) {
            api.get(`/torneios/${cloneId}`).then(res => {
                if (res.data) {
                    setForm({
                        nome: `${res.data.nome} (Cópia)`,
                        descricao: res.data.descricao || '',
                        formato: res.data.formato,
                        max_times: res.data.max_times,
                    });
                }
            }).catch(err => {
                toast.error('Erro ao carregar dados do torneio para clonar');
            });
        }
    }, [cloneId]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
            return;
        }

        setLoading(true);
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
            if (!usuario.id) {
                toast.error('Você precisa estar logado para criar um torneio');
                router.push('/login');
                return;
            }
            await api.post('/torneios', { ...form, organizador_id: usuario.id });
            toast.success('Torneio criado com sucesso!', { icon: <Trophy className="w-4 h-4 text-amber-500" /> });
            router.push('/');
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao criar torneio');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="mb-6 flex items-center gap-2 text-sm text-zinc-600">
                <Link href="/" className="hover:text-zinc-400 transition-colors">Torneios</Link>
                <span>/</span>
                <span className="text-zinc-400">Criar</span>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <p className="text-red-400 text-xs font-bold tracking-[0.3em] uppercase mb-2">Nova competição</p>
                <h1
                    className="text-4xl font-black text-white mb-8"
                    style={{ fontFamily: 'var(--font-chakra), sans-serif' }}
                >
                    Criar torneio
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Form */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 clip-tatico h-fit">
                        <div className="flex gap-2 mb-8">
                            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-red-600' : 'bg-zinc-800'}`} />
                            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-red-600' : 'bg-zinc-800'}`} />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                    <h2 className="text-lg font-bold text-white mb-4">Informações Básicas</h2>
                                    <div className="space-y-4">
                                        <TacticalInput
                                            id="criar-torneio-nome"
                                            type="text"
                                            label="Nome do torneio"
                                            value={form.nome}
                                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                            placeholder="Copa Valorant BR"
                                            required
                                        />
                                        <div>
                                            <label className="block text-zinc-400 text-xs mb-1.5 uppercase tracking-wider font-medium">
                                                Descrição
                                            </label>
                                            <textarea
                                                id="criar-torneio-descricao"
                                                value={form.descricao}
                                                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                                                rows={3}
                                                className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-600 focus:ring-1 focus:ring-red-600/20 text-white rounded px-4 py-3 outline-none transition-all text-sm resize-none placeholder:text-zinc-600"
                                                placeholder="Descreva o torneio, regras, premiação..."
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                                    <h2 className="text-lg font-bold text-white mb-4">Regras e Formato</h2>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-zinc-400 text-xs mb-2 uppercase tracking-wider font-medium">
                                                Formato
                                            </label>
                                            <div className="grid gap-2">
                                                {formatos.map((f) => (
                                                    <label
                                                        key={f.value}
                                                        className={`flex items-center gap-3 p-3.5 rounded border cursor-pointer transition-all ${
                                                            form.formato === f.value
                                                                ? 'border-red-600/60 bg-red-600/10'
                                                                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="formato"
                                                            value={f.value}
                                                            checked={form.formato === f.value}
                                                            onChange={() => setForm({ ...form, formato: f.value })}
                                                            className="accent-red-600"
                                                        />
                                                        <div>
                                                            <p className={`text-sm font-semibold ${form.formato === f.value ? 'text-white' : 'text-zinc-300'}`}>
                                                                {f.label}
                                                            </p>
                                                            <p className="text-xs text-zinc-500">{f.desc}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-zinc-400 text-xs mb-1.5 uppercase tracking-wider font-medium">
                                                Máximo de times: <span className="text-white">{form.max_times}</span>
                                            </label>
                                            <input
                                                id="criar-torneio-max-times"
                                                type="range"
                                                value={form.max_times}
                                                onChange={(e) => setForm({ ...form, max_times: Number(e.target.value) })}
                                                min={2} max={32} step={2}
                                                className="w-full accent-red-600 cursor-pointer"
                                            />
                                            <div className="flex justify-between text-xs text-zinc-600 mt-1 font-mono">
                                                <span>2</span>
                                                <span>32</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="pt-4 flex gap-3">
                                {step === 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 bg-[var(--bg-surface)] border border-zinc-700 text-white font-bold py-3 rounded clip-tatico hover:bg-zinc-800 transition-colors uppercase tracking-widest text-sm"
                                    >
                                        Voltar
                                    </button>
                                )}
                                <TacticalButton
                                    type="submit"
                                    loading={loading}
                                    className="flex-1"
                                >
                                    {step === 1 ? 'Continuar' : 'Criar Torneio'}
                                </TacticalButton>
                            </div>
                        </form>
                    </div>

                    {/* Live Preview */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-600 rounded-full" />
                            Live Preview
                        </h3>
                        <div className="pointer-events-none">
                            <TorneioCard 
                                id={0}
                                nome={form.nome || 'Nome do Torneio'}
                                formato={form.formato}
                                max_times={form.max_times}
                                status="inscricoes_abertas"
                                organizador_nome="Você"
                                inscritos={0}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function CriarTorneio() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="skeleton w-64 h-64"></div></div>}>
            <CriarTorneioForm />
        </Suspense>
    );
}
