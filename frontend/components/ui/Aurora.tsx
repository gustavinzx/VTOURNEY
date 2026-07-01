'use client';
import { useRef, useEffect } from 'react';

interface AuroraProps {
  colorStops?: string[];
  speed?: number;
  className?: string;
}

export default function Aurora({
  colorStops = ['#dc2626', '#7f1d1d', '#09090b'],
  speed = 0.3,
  className = '',
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Layer 1 — main blob
      const x1 = w * 0.5 + Math.sin(t * speed) * w * 0.3;
      const y1 = h * 0.4 + Math.cos(t * speed * 0.7) * h * 0.2;
      const r1 = Math.max(w, h) * 0.6;

      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1);
      grad1.addColorStop(0, hexToRgba(colorStops[0], 0.35));
      grad1.addColorStop(0.5, hexToRgba(colorStops[1], 0.15));
      grad1.addColorStop(1, hexToRgba(colorStops[2], 0));

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      // Layer 2 — secondary blob
      const x2 = w * 0.3 + Math.cos(t * speed * 0.5) * w * 0.25;
      const y2 = h * 0.6 + Math.sin(t * speed * 0.8) * h * 0.25;
      const r2 = Math.max(w, h) * 0.45;

      const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2);
      grad2.addColorStop(0, hexToRgba(colorStops[0], 0.2));
      grad2.addColorStop(1, hexToRgba(colorStops[2], 0));

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);

      // Layer 3 — accent blob
      const x3 = w * 0.75 + Math.sin(t * speed * 0.6 + 2) * w * 0.2;
      const y3 = h * 0.3 + Math.cos(t * speed * 0.9 + 1) * h * 0.2;
      const r3 = Math.max(w, h) * 0.35;

      const grad3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, r3);
      grad3.addColorStop(0, hexToRgba('#ef4444', 0.18));
      grad3.addColorStop(1, hexToRgba(colorStops[2], 0));

      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, w, h);

      t += 0.016;
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [colorStops, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
}
