'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function GlitchText({ text, className }: { text: string; className?: string }) {
    const [isGlitching, setIsGlitching] = useState(true);

    useEffect(() => {
        // Stop glitching after initial load
        const t = setTimeout(() => setIsGlitching(false), 2000);
        return () => clearTimeout(t);
    }, []);

    if (!isGlitching) {
        return <span className={className}>{text}</span>;
    }

    return (
        <span className={`relative inline-block ${className}`}>
            <motion.span
                className="absolute top-0 left-[-2px] text-red-500 opacity-70"
                animate={{ x: [-2, 2, -2, 0], y: [1, -1, 0, 0] }}
                transition={{ duration: 0.2, repeat: 10 }}
            >
                {text}
            </motion.span>
            <motion.span
                className="absolute top-0 left-[2px] text-cyan-500 opacity-70"
                animate={{ x: [2, -2, 2, 0], y: [-1, 1, 0, 0] }}
                transition={{ duration: 0.2, repeat: 10, delay: 0.05 }}
            >
                {text}
            </motion.span>
            <span className="relative text-white">{text}</span>
        </span>
    );
}
