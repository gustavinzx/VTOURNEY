'use client';

type Status = 'inscricoes_abertas' | 'em_andamento' | 'finalizado' | 'cancelado' | string;

const statusConfig: Record<string, { label: string; dotColor: string; textColor: string; bgColor: string; pulse: boolean }> = {
  inscricoes_abertas: {
    label: 'Inscrições abertas',
    dotColor: 'bg-emerald-400',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10 border-emerald-400/20',
    pulse: true,
  },
  em_andamento: {
    label: 'Em andamento',
    dotColor: 'bg-yellow-400',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10 border-yellow-400/20',
    pulse: true,
  },
  finalizado: {
    label: 'Finalizado',
    dotColor: 'bg-zinc-500',
    textColor: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10 border-zinc-500/20',
    pulse: false,
  },
  cancelado: {
    label: 'Cancelado',
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    pulse: false,
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    dotColor: 'bg-zinc-400',
    textColor: 'text-zinc-400',
    bgColor: 'bg-zinc-400/10 border-zinc-400/20',
    pulse: false,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotColor}`} />
      </span>
      {config.label}
    </span>
  );
}
