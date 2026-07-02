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
        <span 
            className={`glitch-text ${className}`} 
            data-text={text}
            onMouseEnter={() => setIsGlitching(true)}
            onMouseLeave={() => {
                // Keep it glitched for a tiny bit after hover
                setTimeout(() => setIsGlitching(false), 500);
            }}
        >
            {text}
        </span>
    );
}
