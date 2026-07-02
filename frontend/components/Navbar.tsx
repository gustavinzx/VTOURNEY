'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CommandPalette } from './CommandPalette';
import { Search } from 'lucide-react';

const navLinks = [
    { href: '/', label: 'Torneios' },
    { href: '/times', label: 'Times' },
    { href: '/tracker', label: 'Tracker' },
];

export default function Navbar() {
    const [usuario, setUsuario] = useState<{ nome: string; id: number; avatar_url?: string } | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [cmdOpen, setCmdOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (u) {
            try {
                const parsed = JSON.parse(u);
                const userObj = parsed.usuario || parsed;
                if (!userObj.id) {
                    localStorage.removeItem('usuario');
                    localStorage.removeItem('token');
                } else {
                    setUsuario(userObj);
                }
            } catch {
                localStorage.removeItem('usuario');
                localStorage.removeItem('token');
            }
        }
        
        function handleStorage() {
            const u = localStorage.getItem('usuario');
            if (u) {
                try {
                    const parsed = JSON.parse(u);
                    const userObj = parsed.usuario || parsed;
                    if (userObj.id) setUsuario(userObj);
                } catch {
                    localStorage.removeItem('usuario');
                }
            } else {
                setUsuario(null);
            }
        }
        
        window.addEventListener('storage', handleStorage);
        // Custom event so same-tab updates can trigger it too
        window.addEventListener('localStorageChange', handleStorage);
        
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('localStorageChange', handleStorage);
        };
    }, []);

    useEffect(() => {
        function onScroll() {
            setScrolled(window.scrollY > 10);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close menu on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    function sair() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
        router.push('/login');
    }

    const initials = usuario?.nome
        ? usuario.nome
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? '')
              .join('')
        : '';

    return (
        <nav
            className={`sticky top-0 z-40 transition-all duration-300 ${
                scrolled
                    ? 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 shadow-lg shadow-black/30 py-2'
                    : 'bg-transparent border-b border-transparent py-4'
            }`}
        >
            <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span
                        className="text-red-500 font-black text-xl tracking-widest uppercase group-hover:text-red-400 transition-colors"
                        style={{ fontFamily: 'var(--font-chakra), sans-serif' }}
                    >
                        V<span className="text-white">Tourney</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => {
                        const isActive =
                            link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative text-sm uppercase tracking-wider font-bold transition-colors ${
                                    isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                {link.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="navbar-active-indicator"
                                        className="absolute -bottom-2 left-0 right-0 h-[2px] bg-red-600"
                                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right side */}
                <div className="hidden md:flex items-center gap-4">
                    <button 
                        onClick={() => setCmdOpen(true)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 border border-zinc-800 px-3 py-1.5 rounded-lg text-sm group"
                    >
                        <Search className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
                        <span className="hidden lg:inline">Buscar...</span>
                        <kbd className="ml-2 font-mono text-[10px] font-bold uppercase bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">⌘K</kbd>
                    </button>
                    
                    <div className="w-px h-6 bg-zinc-800 mx-2" />

                    {usuario ? (
                        <>
                            <Link
                                href="/perfil"
                                className="flex items-center gap-2 group"
                            >
                                <div className="w-8 h-8 clip-tatico bg-red-600 flex items-center justify-center text-xs font-black text-white group-hover:bg-red-500 transition-colors relative overflow-hidden">
                                    {usuario.avatar_url ? (
                                        <img src={usuario.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors max-w-[120px] truncate">
                                    {usuario.nome}
                                </span>
                            </Link>
                            <button
                                onClick={sair}
                                className="text-xs text-zinc-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                            >
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
                            >
                                Entrar
                            </Link>
                            <Link
                                href="/cadastro"
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 clip-tatico text-sm font-bold uppercase tracking-wider transition-colors"
                            >
                                Cadastrar
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="Menu"
                >
                    <motion.span
                        className="block w-5 h-0.5 bg-zinc-400 origin-center"
                        animate={menuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.span
                        className="block w-5 h-0.5 bg-zinc-400"
                        animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.span
                        className="block w-5 h-0.5 bg-zinc-400 origin-center"
                        animate={menuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                </button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        ref={menuRef}
                        className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-2xl"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="px-4 py-4 space-y-1">
                            {navLinks.map((link) => {
                                const isActive =
                                    link.href === '/'
                                        ? pathname === '/'
                                        : pathname.startsWith(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-zinc-800 text-white'
                                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}

                            <div className="pt-2 border-t border-zinc-800 mt-2">
                                {usuario ? (
                                    <div className="space-y-1">
                                        <Link
                                            href="/perfil"
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
                                        >
                                            <div className="w-10 h-10 clip-tatico bg-red-600 flex items-center justify-center text-sm font-black text-white relative overflow-hidden">
                                                {usuario.avatar_url ? (
                                                    <img src={usuario.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    initials
                                                )}
                                            </div>
                                            <span className="text-sm text-zinc-300">{usuario.nome}</span>
                                        </Link>
                                        <button
                                            onClick={sair}
                                            className="w-full text-left px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            Sair
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Link
                                            href="/login"
                                            className="block px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                                        >
                                            Entrar
                                        </Link>
                                        <Link
                                            href="/cadastro"
                                            className="block px-3 py-2 clip-tatico text-sm bg-red-600 text-white font-bold uppercase tracking-wider text-center hover:bg-red-500 transition-colors"
                                        >
                                            Cadastrar
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
