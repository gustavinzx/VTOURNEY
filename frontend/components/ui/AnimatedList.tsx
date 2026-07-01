'use client';
import { motion } from 'framer-motion';

export function AnimatedList({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 },
                },
            }}
        >
            {children}
        </motion.div>
    );
}

export function AnimatedListItem({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, scale: 0.8, y: 10 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { type: 'spring', stiffness: 300, damping: 24 },
                },
            }}
        >
            {children}
        </motion.div>
    );
}
