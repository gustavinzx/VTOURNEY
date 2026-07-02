import type { Metadata } from 'next';
import { Chakra_Petch } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from 'sonner';

const chakra = Chakra_Petch({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-chakra',
});

export const metadata: Metadata = {
    title: 'VTourney — Plataforma de Torneios de Valorant',
    description:
        'Crie ou entre em torneios de Valorant, monte seu time e acompanhe suas stats em tempo real.',
    keywords: ['Valorant', 'torneio', 'esports', 'times', 'competitivo'],
    openGraph: {
        title: 'VTourney — Plataforma de Torneios de Valorant',
        description: 'Compete. Vence. Domina.',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" className={`${chakra.variable}`}>
            <body className="bg-zinc-950 text-white min-h-screen antialiased font-chakra">
                <Navbar />
                <main>{children}</main>
                <Toaster
                    theme="dark"
                    position="bottom-right"
                    richColors
                    closeButton
                    toastOptions={{
                        duration: 3500,
                        className: 'font-chakra',
                        style: {
                            fontFamily: 'var(--font-chakra), sans-serif',
                        },
                    }}
                />
            </body>
        </html>
    );
}
