'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function TrackerSearchPage() {
    const [riotId, setRiotId] = useState('');
    const router = useRouter();

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!riotId.includes('#')) return;

        // Formats "Nome#Tag" to "Nome-Tag" for the URL and trims spaces around the hash
        const parts = riotId.split('#');
        const slug = `${parts[0].trim()}-${parts[1].trim()}`;
        router.push(`/tracker/${slug}`);
    }

    return (
        <div className="min-h-[calc(100vh-57px)] flex items-center justify-center p-4 relative overflow-hidden bg-[var(--bg-base)]">
            <div className="absolute inset-0 scanlines opacity-50 pointer-events-none" />
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <motion.div
                className="relative z-10 w-full max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-8">
                    <h1 className="font-chakra font-black text-5xl uppercase tracking-wider text-white mb-3">
                        Combat <span className="text-red-500">Tracker</span>
                    </h1>
                    <p className="text-zinc-400">Busque as estatísticas e o histórico de qualquer jogador.</p>
                </div>

                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 clip-tatico" />
                    
                    <div className="relative bg-[var(--bg-surface)] border border-zinc-700 p-2 clip-tatico flex items-center">
                        <input
                            type="text"
                            placeholder="Nome#Tag"
                            value={riotId}
                            onChange={(e) => setRiotId(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-white px-4 py-3 font-mono text-lg placeholder:text-zinc-600"
                        />
                        <button
                            type="submit"
                            disabled={!riotId.includes('#')}
                            className="bg-red-600 text-white font-bold uppercase tracking-widest text-sm px-8 py-3 clip-tatico hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            Buscar
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
