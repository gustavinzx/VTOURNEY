'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface TacticalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const TacticalInput = React.forwardRef<HTMLInputElement, TacticalInputProps>(
    ({ label, className = '', ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);

        return (
            <div className="relative w-full">
                {label && (
                    <label className="block text-zinc-400 text-xs mb-1.5 uppercase tracking-wider font-medium">
                        {label}
                    </label>
                )}
                <div className="relative group bg-zinc-900 border-none rounded">
                    <input
                        ref={ref}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        className={`w-full bg-transparent text-white px-4 py-3 outline-none transition-colors text-sm placeholder:text-zinc-600 ${className}`}
                        {...props}
                    />
                    
                    {/* Animated Underline */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-800" />
                    <motion.div
                        className="absolute bottom-0 left-0 h-[2px] bg-red-600"
                        initial={{ width: 0 }}
                        animate={{ width: isFocused ? '100%' : '0%' }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                </div>
            </div>
        );
    }
);
TacticalInput.displayName = 'TacticalInput';
