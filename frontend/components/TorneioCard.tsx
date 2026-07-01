'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge';

const formatoLabel: Record<string, string> = {
  eliminacao_simples: 'Eliminação simples',
  eliminacao_dupla: 'Eliminação dupla',
  pontos_corridos: 'Pontos corridos',
};

interface TorneioCardProps {
  id: number;
  nome: string;
  formato: string;
  max_times: number;
  status: string;
  organizador_nome: string;
  data_inicio?: string | null;
  inscritos?: number;
}

export default function TorneioCard({
  id,
  nome,
  formato,
  max_times,
  status,
  organizador_nome,
  data_inicio,
  inscritos,
}: TorneioCardProps) {
  const pct = inscritos != null ? Math.round((inscritos / max_times) * 100) : null;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="h-full"
    >
      <Link
        href={`/torneios/${id}`}
        className="group flex flex-col h-full border border-zinc-800 hover:border-red-600/50 bg-[var(--bg-surface)] clip-tatico-tr p-5 transition-all duration-300 hover:bg-zinc-900 relative overflow-hidden"
      >
        {/* Hover scanline effect */}
        <div className="absolute inset-0 scanlines-red opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4 gap-2 relative z-10">
          <h3 className="font-chakra uppercase font-bold text-lg text-white group-hover:text-red-400 transition-colors leading-tight line-clamp-2">
            {nome}
          </h3>
          <StatusBadge status={status} className="shrink-0" />
        </div>

        {/* Details */}
        <div className="flex-1 space-y-2 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">⚔</span>
            <span className="text-zinc-300">{formatoLabel[formato] ?? formato}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">👤</span>
            <span className="text-zinc-400">{organizador_nome}</span>
          </div>
          {data_inicio && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">📅</span>
              <span className="text-zinc-400">
                {new Date(data_inicio).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {/* Footer — capacity bar */}
        <div className="mt-4 pt-4 border-t border-zinc-800 relative z-10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Vagas</span>
            <span className="text-zinc-400 font-medium font-chakra">
              {inscritos != null ? `${inscritos} / ${max_times}` : `Até ${max_times}`}
            </span>
          </div>
          {pct != null && (
            <div className="h-[6px] bg-zinc-900 border border-zinc-800 overflow-hidden clip-tatico-bl">
              <motion.div
                className="h-full bg-red-600"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          )}
        </div>
        </div>
      </Link>
    </motion.div>
  );
}
