'use client';

import { motion } from 'framer-motion';

export function AuroraBackground({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative w-full h-full overflow-hidden bg-zinc-950">
            {/* The Aurora Gradients */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <motion.div
                    className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/30 rounded-full blur-[100px]"
                    animate={{
                        x: ['0%', '20%', '0%'],
                        y: ['0%', '10%', '0%'],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-900/30 rounded-full blur-[120px]"
                    animate={{
                        x: ['0%', '-20%', '0%'],
                        y: ['0%', '-10%', '0%'],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Tactical Grid Overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Scanlines */}
            <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 w-full h-full">{children}</div>
        </div>
    );
}
