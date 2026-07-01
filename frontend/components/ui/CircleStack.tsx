'use client';

import { motion } from 'framer-motion';

const defaultAvatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jett&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Phoenix&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Reyna&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sage&backgroundColor=ffdfbf',
];

export function CircleStack({ avatars = defaultAvatars, limit = 4, totalCount = 1204 }: { avatars?: string[], limit?: number, totalCount?: number }) {
    const displayAvatars = avatars.slice(0, limit);
    const extraCount = totalCount - displayAvatars.length;

    return (
        <div className="flex items-center">
            <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
                {displayAvatars.map((url, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, ease: 'easeOut' }}
                        className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 relative overflow-hidden flex-shrink-0"
                        style={{ zIndex: limit - i }}
                    >
                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                    </motion.div>
                ))}
                {extraCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: limit * 0.1 }}
                        className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-red-600 flex items-center justify-center text-[10px] font-black text-white relative flex-shrink-0"
                        style={{ zIndex: 0 }}
                    >
                        +{extraCount > 999 ? '1k' : extraCount}
                    </motion.div>
                )}
            </div>
            <div className="ml-4 text-xs font-medium text-zinc-400">
                Jogadores competindo
            </div>
        </div>
    );
}
