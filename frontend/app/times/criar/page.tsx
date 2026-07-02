'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Shield } from 'lucide-react';

export default function CriarTime() {
    const [form, setForm] = useState({ nome: '', tag: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/times', form);
            toast.success('Time criado com sucesso!', {
                icon: <Shield className="w-4 h-4 text-green-500" />
            });
            router.push(`/times/${data.id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.erro ?? 'Erro ao criar time');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-12">
            <div className="mb-6 flex items-center gap-2 text-sm text-zinc-600">
                <Link href="/times" className="hover:text-zinc-400 transition-colors">Times</Link>
                <span>/</span>
                <span className="text-zinc-400">Criar</span>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <p className="text-red-400 text-xs font-bold tracking-[0.3em] uppercase mb-2">Novo time</p>
                <h1
                    className="text-4xl font-black text-white mb-8"
                    style={{ fontFamily: 'var(--font-chakra), sans-serif' }}
                >
                    Criar time
                </h1>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-zinc-400 text-xs mb-1.5 uppercase tracking-wider font-medium">
                                Nome do time
                            </label>
                            <input
                                id="criar-time-nome"
                                type="text"
                                value={form.nome}
                                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                className="w-full bg-zinc-800/50 border border-zinc-700 focus:border-red-600 focus:ring-1 focus:ring-red-600/20 text-white rounded-xl px-4 py-3 outline-none transition-all text-sm placeholder:text-zinc-600"
                                placeholder="Ex: Phoenix Rising"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-zinc-400 text-xs mb-1.5 uppercase tracking-wider font-medium">
                                Tag{' '}
                                <span className="text-zinc-600 normal-case tracking-normal font-normal">
                                    (máx. 5 caracteres)
                                </span>
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-600 text-sm font-mono">#</span>
                                <input
                                    id="criar-time-tag"
                                    type="text"
                                    value={form.tag}
                                    onChange={(e) =>
                                        setForm({ ...form, tag: e.target.value.slice(0, 5).toUpperCase() })
                                    }
                                    className="flex-1 bg-zinc-800/50 border border-zinc-700 focus:border-red-600 focus:ring-1 focus:ring-red-600/20 text-white rounded-xl px-4 py-3 outline-none transition-all text-sm placeholder:text-zinc-600 font-mono uppercase"
                                    placeholder="PH"
                                    maxLength={5}
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        {(form.nome || form.tag) && (
                            <div className="border border-zinc-700 rounded-xl p-4 bg-zinc-800/30">
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Preview</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-sm font-black text-white">
                                        {(form.tag || form.nome).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{form.nome || 'Nome do time'}</p>
                                        {form.tag && (
                                            <p className="text-xs text-zinc-500 font-mono">#{form.tag}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            id="criar-time-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-red-900/30 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Criando...
                                </span>
                            ) : (
                                'Criar time'
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
