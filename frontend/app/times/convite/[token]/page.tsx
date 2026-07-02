'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { MailOpen } from 'lucide-react';

export default function ConvitePage() {
    const params = useParams();
    const token = params?.token as string;
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [usuario, setUsuario] = useState<any>(null);

    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (u) {
            setUsuario(JSON.parse(u));
        }
    }, []);

    async function handleAceitar() {
        if (!usuario) {
            toast.error('Você precisa estar logado para entrar no time!');
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(`/times/convite/${token}`);
            toast.success(res.data.mensagem);
            router.push(`/times/${res.data.time_id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.erro || 'Erro ao aceitar convite');
            if (err.response?.status === 404) {
                router.push('/times');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-96 h-96 bg-red-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 text-center relative z-10 backdrop-blur-sm shadow-2xl shadow-black/50"
            >
                <div className="w-20 h-20 bg-zinc-800 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-inner border border-zinc-700 text-zinc-400">
                    <MailOpen className="w-8 h-8" />
                </div>
                
                <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-chakra), sans-serif' }}>
                    Convite de Time
                </h1>
                
                <p className="text-zinc-400 mb-8 text-sm">
                    Você foi convidado para participar de uma equipe no VTOURNEY.
                </p>

                {!usuario ? (
                    <div className="space-y-3">
                        <p className="text-amber-500 text-sm font-bold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 mb-4">
                            Você precisa estar logado para aceitar este convite.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
                        >
                            Fazer Login
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleAceitar}
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-red-900/20 hover:shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:-translate-y-0 text-sm uppercase tracking-widest clip-tatico"
                    >
                        {loading ? 'Entrando...' : 'Aceitar Convite e Entrar'}
                    </button>
                )}
            </motion.div>
        </div>
    );
}
