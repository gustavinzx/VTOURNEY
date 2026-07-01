'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface TacticalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    children: React.ReactNode;
}

export const TacticalButton = React.forwardRef<HTMLButtonElement, TacticalButtonProps>(
    ({ loading, children, className = '', disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`relative w-full bg-red-600 text-white font-bold py-3 px-4 clip-tatico hover:bg-red-500 transition-colors disabled:opacity-50 uppercase tracking-widest text-sm overflow-hidden group ${className}`}
                {...props}
            >
                <div className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                    {children}
                </div>
                
                {/* Linear loader (tactical bar style) */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1/2 h-1 bg-white/20 rounded-full overflow-hidden relative">
                            <motion.div
                                className="absolute top-0 left-0 bottom-0 w-1/2 bg-white"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                        </div>
                    </div>
                )}
            </button>
        );
    }
);
TacticalButton.displayName = 'TacticalButton';
