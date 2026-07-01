'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface BracketTeam {
    id: string;
    name: string;
    score: number | null;
    isWinner?: boolean;
}

export interface BracketMatch {
    id: string;
    nextMatchId: string | null;
    team1: BracketTeam | null;
    team2: BracketTeam | null;
    status: 'pending' | 'live' | 'finished';
}

export interface BracketRound {
    title: string;
    matches: BracketMatch[];
}

interface TournamentBracketProps {
    rounds: BracketRound[];
    onMatchClick?: (match: BracketMatch) => void;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 80;
const COLUMN_GAP = 80;
const ROW_GAP = 40;
const COLUMN_WIDTH = NODE_WIDTH + COLUMN_GAP;
const ROW_HEIGHT = NODE_HEIGHT + ROW_GAP;

export default function TournamentBracket({ rounds, onMatchClick }: TournamentBracketProps) {
    const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);

    if (!rounds || rounds.length === 0) {
        return (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                A chave do torneio ainda não foi gerada.
            </div>
        );
    }

    // Calcular altura e largura total do SVG
    const maxMatchesInRound = Math.max(...rounds.map((r) => r.matches.length));
    const totalHeight = maxMatchesInRound * ROW_HEIGHT + ROW_GAP;
    const totalWidth = rounds.length * COLUMN_WIDTH;

    // Gerar conexões (linhas SVG)
    const connections: { id: string; d: string; sourceMatchId: string; targetMatchId: string }[] = [];

    rounds.forEach((round, rIndex) => {
        if (rIndex === rounds.length - 1) return; // Última rodada não tem nextMatch
        round.matches.forEach((match, mIndex) => {
            if (!match.nextMatchId) return;

            // Encontrar o target na próxima rodada
            const nextRound = rounds[rIndex + 1];
            const targetMatchIndex = nextRound.matches.findIndex((m) => m.id === match.nextMatchId);
            
            if (targetMatchIndex === -1) return;

            // Coordenadas Origem
            const x1 = rIndex * COLUMN_WIDTH + NODE_WIDTH;
            const y1 = ROW_HEIGHT * (mIndex * (2 ** rIndex) + (2 ** rIndex - 1) / 2) + NODE_HEIGHT / 2;

            // Coordenadas Destino
            const x2 = (rIndex + 1) * COLUMN_WIDTH;
            const y2 = ROW_HEIGHT * (targetMatchIndex * (2 ** (rIndex + 1)) + (2 ** (rIndex + 1) - 1) / 2) + NODE_HEIGHT / 2;

            const midX = (x1 + x2) / 2;

            const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

            connections.push({
                id: `${match.id}-${match.nextMatchId}`,
                d,
                sourceMatchId: match.id,
                targetMatchId: match.nextMatchId,
            });
        });
    });

    return (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div
                className="relative"
                style={{ width: totalWidth, height: totalHeight, minWidth: '800px' }}
            >
                {/* SVG Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    {connections.map((conn) => {
                        const isHovered = hoveredMatch === conn.sourceMatchId || hoveredMatch === conn.targetMatchId;
                        return (
                            <motion.path
                                key={conn.id}
                                d={conn.d}
                                fill="none"
                                stroke={isHovered ? '#ef4444' : '#3f3f46'}
                                strokeWidth={isHovered ? 3 : 2}
                                strokeDasharray={isHovered ? '0' : '4 4'}
                                animate={{
                                    stroke: isHovered ? '#ef4444' : '#3f3f46',
                                    strokeWidth: isHovered ? 3 : 2,
                                }}
                                transition={{ duration: 0.3 }}
                                className={isHovered ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : ''}
                            />
                        );
                    })}
                </svg>

                {/* Match Nodes */}
                {rounds.map((round, rIndex) => (
                    <React.Fragment key={round.title}>
                        {/* Título da Rodada */}
                        <div
                            className="absolute text-center w-[240px] text-zinc-500 font-bold uppercase tracking-widest text-xs"
                            style={{
                                left: rIndex * COLUMN_WIDTH,
                                top: 0,
                            }}
                        >
                            {round.title}
                        </div>

                        {round.matches.map((match, mIndex) => {
                            const x = rIndex * COLUMN_WIDTH;
                            const y = ROW_HEIGHT * (mIndex * (2 ** rIndex) + (2 ** rIndex - 1) / 2) + 30; // +30 for title offset

                            return (
                                <div
                                    key={match.id}
                                    className="absolute"
                                    style={{ left: x, top: y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                                    onMouseEnter={() => setHoveredMatch(match.id)}
                                    onMouseLeave={() => setHoveredMatch(null)}
                                >
                                    <MatchNode match={match} onClick={() => onMatchClick && onMatchClick(match)} clickable={!!onMatchClick} />
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

function MatchNode({ match, onClick, clickable }: { match: BracketMatch, onClick?: () => void, clickable?: boolean }) {
    const isLive = match.status === 'live';
    const canClick = clickable && (isLive || match.status === 'pending') && match.team1 && match.team2;

    return (
        <motion.div
            whileHover={canClick ? { scale: 1.02 } : {}}
            onClick={canClick ? onClick : undefined}
            className={`w-full h-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 shadow-lg relative z-10 transition-all clip-tatico hover:border-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)] flex flex-col justify-center gap-1.5 ${
                isLive ? 'border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]' : ''
            } ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
            {isLive && (
                <div className="absolute -top-2.5 right-4 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                    Live
                </div>
            )}
            
            <TeamRow team={match.team1} />
            <div className="h-px w-full bg-zinc-800/80 my-0.5" />
            <TeamRow team={match.team2} />
        </motion.div>
    );
}

function TeamRow({ team }: { team: BracketTeam | null }) {
    if (!team) {
        return (
            <div className="flex justify-between items-center px-2 py-1">
                <span className="text-zinc-600 italic text-sm">TBD</span>
                <span className="text-zinc-700 font-mono text-sm">-</span>
            </div>
        );
    }

    return (
        <div className={`flex justify-between items-center px-2 py-1 rounded ${team.isWinner ? 'bg-zinc-800/80' : ''}`}>
            <span className={`text-sm truncate font-medium ${team.isWinner ? 'text-white font-bold' : 'text-zinc-400'}`}>
                {team.name}
            </span>
            <span className={`font-mono text-sm ml-3 ${team.isWinner ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                {team.score !== null ? team.score : '-'}
            </span>
        </div>
    );
}
