'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [usuario, setUsuario] = useState<{ nome: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const u = localStorage.getItem('usuario');
        if (u) setUsuario(JSON.parse(u));
    }, []);

    function sair() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
        router.push('/login');
    }

    return (
        <nav className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-red-500 font-black text-xl tracking-widest uppercase">VTourney</span>
                </Link>

                <div className="flex items-center gap-6 text-sm">
                    <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Torneios</Link>
                    <Link href="/times" className="text-zinc-400 hover:text-white transition-colors">Times</Link>

                    {usuario ? (
                        <>
                            <Link href="/perfil" className="text-zinc-400 hover:text-white transition-colors">
                                {usuario.nome}
                            </Link>
                            <button
                                onClick={sair}
                                className="text-zinc-500 hover:text-red-400 transition-colors"
                            >
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">Entrar</Link>
                            <Link
                                href="/cadastro"
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded text-sm font-semibold transition-colors"
                            >
                                Cadastrar
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
