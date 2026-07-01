'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, Trophy, Users, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function CommandPalette({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(true);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [setOpen]);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, [setOpen]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />
                    
                    <motion.div
                        className="relative z-10 w-full max-w-lg bg-zinc-950/90 border border-zinc-800 shadow-2xl clip-tatico overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />
                        
                        <Command className="relative z-10 w-full h-full text-zinc-300" label="Global Command Menu">
                            <div className="flex items-center border-b border-zinc-800 px-4">
                                <Search className="w-5 h-5 text-red-500 mr-2" />
                                <Command.Input
                                    autoFocus
                                    placeholder="Buscar torneios, jogadores ou times..."
                                    className="w-full bg-transparent border-none outline-none py-4 text-white placeholder:text-zinc-600 font-mono text-sm"
                                />
                                <div className="text-[10px] uppercase font-bold text-zinc-600 bg-zinc-900 px-2 py-1 rounded">ESC</div>
                            </div>

                            <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700">
                                <Command.Empty className="py-6 text-center text-zinc-500 text-sm">
                                    Nenhum resultado encontrado.
                                </Command.Empty>

                                <Command.Group heading={<span className="text-[10px] uppercase tracking-widest text-zinc-500 px-2">Navegação Rápida</span>}>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/'))}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-red-500/10 hover:text-white cursor-pointer transition-colors aria-selected:bg-red-500/20 aria-selected:text-white group"
                                    >
                                        <Trophy className="w-4 h-4 text-zinc-400 group-hover:text-red-400" />
                                        <span>Explorar Torneios</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/tracker'))}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-red-500/10 hover:text-white cursor-pointer transition-colors aria-selected:bg-red-500/20 aria-selected:text-white group"
                                    >
                                        <Crosshair className="w-4 h-4 text-zinc-400 group-hover:text-red-400" />
                                        <span>Tracker de Jogadores</span>
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => router.push('/times'))}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-red-500/10 hover:text-white cursor-pointer transition-colors aria-selected:bg-red-500/20 aria-selected:text-white group"
                                    >
                                        <Users className="w-4 h-4 text-zinc-400 group-hover:text-red-400" />
                                        <span>Rankings de Times</span>
                                    </Command.Item>
                                </Command.Group>
                            </Command.List>
                        </Command>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
