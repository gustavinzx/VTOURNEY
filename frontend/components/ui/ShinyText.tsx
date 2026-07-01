'use client';

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number; // seconds per cycle
}

export default function ShinyText({ text, className = '', speed = 2.5 }: ShinyTextProps) {
  return (
    <span
      className={className}
      style={{
        background: `linear-gradient(
          90deg,
          #fbbf24 0%,
          #ffffff 25%,
          #fbbf24 50%,
          #ffffff 75%,
          #fbbf24 100%
        )`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: `shine ${speed}s linear infinite`,
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  );
}
