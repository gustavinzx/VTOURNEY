import type { Metadata } from 'next';
import { Inter, Chakra_Petch } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
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
        <html lang="pt-BR" className={`${inter.variable} ${chakra.variable}`}>
            <body className="bg-zinc-950 text-white min-h-screen antialiased">
                <Navbar />
                <main>{children}</main>
                <Toaster
                    theme="dark"
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: '#18181b',
                            border: '1px solid #3f3f46',
                            color: '#fafafa',
                        },
                    }}
                />
            </body>
        </html>
    );
}
