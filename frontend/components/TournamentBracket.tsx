'use client';

import { motion } from 'framer-motion';

interface Match {
    id: number;
    team1: string;
    team2: string;
    score1: number;
    score2: number;
    winner: 1 | 2 | null;
}

interface TournamentBracketProps {
    matches: Match[];
}

export default function TournamentBracket({ matches }: TournamentBracketProps) {
    if (!matches || matches.length === 0) {
        return (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                A chave do torneio ainda não foi gerada.
            </div>
        );
    }

    // A very simple static SVG bracket for visual representation
    return (
        <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px] h-[400px] relative">
                {/* SVG Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    <path d="M 200 100 L 250 100 L 250 200 L 300 200" fill="none" stroke="#3f3f46" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M 200 300 L 250 300 L 250 200 L 300 200" fill="none" stroke="#3f3f46" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M 500 200 L 600 200" fill="none" stroke="#3f3f46" strokeWidth="2" strokeDasharray="4 4" />
                </svg>

                {/* Quarter Finals */}
                <div className="absolute left-0 top-[60px] w-[200px]">
                    <MatchNode match={matches[0]} />
                </div>
                <div className="absolute left-0 top-[260px] w-[200px]">
                    <MatchNode match={matches[1]} />
                </div>

                {/* Semi Finals */}
                <div className="absolute left-[300px] top-[160px] w-[200px]">
                    <MatchNode match={matches[2]} />
                </div>

                {/* Final */}
                <div className="absolute left-[600px] top-[160px] w-[200px]">
                    <div className="text-red-500 font-bold text-xs uppercase tracking-wider mb-2 text-center animate-pulse">
                        Grand Final
                    </div>
                    <MatchNode match={matches[3]} />
                </div>
            </div>
        </div>
    );
}

function MatchNode({ match }: { match?: Match }) {
    if (!match) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 w-full animate-pulse">
                <div className="h-6 bg-zinc-800 rounded mb-2 w-3/4"></div>
                <div className="h-6 bg-zinc-800 rounded w-1/2"></div>
            </div>
        );
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[var(--bg-surface)] border border-zinc-700 rounded p-2 shadow-lg relative z-10 transition-colors hover:border-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-pointer"
        >
            <div className={`flex justify-between items-center p-1 rounded ${match.winner === 1 ? 'bg-zinc-800 font-bold text-white' : 'text-zinc-400'}`}>
                <span>{match.team1}</span>
                <span className="font-mono">{match.score1}</span>
            </div>
            <div className="h-px bg-zinc-700 my-1" />
            <div className={`flex justify-between items-center p-1 rounded ${match.winner === 2 ? 'bg-zinc-800 font-bold text-white' : 'text-zinc-400'}`}>
                <span>{match.team2}</span>
                <span className="font-mono">{match.score2}</span>
            </div>
        </motion.div>
    );
}
