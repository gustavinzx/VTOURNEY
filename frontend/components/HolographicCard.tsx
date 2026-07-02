'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';

export function HolographicCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    const cardRef = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Mola para suavizar o tilt (o efeito fica fluido)
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

    // Converte a posição do mouse (em % ou pixels) em rotação 3D (ex: max 15 graus)
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

    // Brilho holográfico (posição da luz)
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);
    const glareOpacity = useTransform(mouseXSpring, [-0.5, 0, 0.5], [0.1, 0, 0.1]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Posição do mouse relativa ao centro (-0.5 a 0.5)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const background = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255, 70, 85, 0.4) 0%, transparent 60%)`;

    return (
        <div style={{ perspective: 1000 }} className="h-full">
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className={`relative w-full h-full transition-transform duration-100 ease-linear ${className}`}
            >
                {/* O conteúdo do card */}
                {children}

                {/* Camada de brilho holográfico */}
                <motion.div
                    className="absolute inset-0 pointer-events-none mix-blend-overlay clip-tatico"
                    style={{
                        background,
                        opacity: glareOpacity,
                    }}
                />
            </motion.div>
        </div>
    );
}
