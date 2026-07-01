'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface TimeCardProps {
  id: number;
  nome: string;
  tag?: string;
  capitao_nome: string;
  total_membros?: number;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function getTagInitials(tag: string | undefined, nome: string): string {
  if (tag) return tag.toUpperCase().slice(0, 3);
  return getInitials(nome);
}

// Deterministic hue from string
function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export default function TimeCard({
  id,
  nome,
  tag,
  capitao_nome,
  total_membros,
  href,
  onClick,
  selected = false,
}: TimeCardProps) {
  const hue = stringToHue(nome);
  const initials = getTagInitials(tag, nome);

  const inner = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`group flex items-center gap-4 border p-4 transition-all duration-300 relative overflow-hidden clip-tatico-tr ${
        selected
          ? 'border-red-500 bg-red-600/10 cursor-pointer'
          : 'border-zinc-800 hover:border-zinc-600 bg-[var(--bg-surface)] hover:bg-zinc-800/80 cursor-pointer'
      }`}
    >
      {/* Scanline hover effect */}
      <div className="absolute inset-0 scanlines opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Logo */}
      <div
        className="relative z-10 w-12 h-12 clip-tatico flex items-center justify-center text-sm font-black text-white shrink-0 shadow-lg"
        style={{
          background: `linear-gradient(135deg, hsl(${hue},70%,35%), hsl(${hue},60%,20%))`,
        }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-chakra uppercase font-bold text-white group-hover:text-red-400 transition-colors truncate text-lg">
            {nome}
          </p>
          {tag && (
            <span className="text-xs text-zinc-500 font-chakra font-bold bg-zinc-800 px-1.5 py-0.5 rounded-sm shrink-0 border border-zinc-700">
              #{tag}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-bold">CAP: <span className="text-zinc-400">{capitao_nome}</span></p>
      </div>

      {/* Members */}
      {total_membros != null && (
        <div className="relative z-10 text-center shrink-0">
          <p className="text-xl font-chakra font-black text-white">{total_membros}</p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">membros</p>
        </div>
      )}

      {selected && (
        <div className="relative z-10 shrink-0 w-6 h-6 clip-tatico bg-red-500 flex items-center justify-center text-white text-xs font-bold">
          ✓
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block">{inner}</Link>;
  }
  return inner;
}
