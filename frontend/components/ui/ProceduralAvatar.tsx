'use client';

/**
 * Avatar procedural (identicon) gerado 100% em SVG no cliente.
 * Algoritmo:
 *  1. Hash djb2 da string de entrada (riot_id ou nome)
 *  2. Grade 5×5 de células, espelhada horizontalmente (como o GitHub Identicon)
 *  3. Cor base = derivada do rank tier atual do jogador
 *
 * Por que SVG e não Canvas?
 * SVG é inline, server-renderable e não tem problema de CORS em exports
 * (html-to-image consegue serializar SVG diretamente).
 */

interface ProceduralAvatarProps {
    seed: string;           // riot_id ou nome — fonte do hash
    size?: number;          // tamanho em px (padrão 48)
    rankColor?: string;     // cor hex do rank tier (padrão vermelho VTourney)
    rounded?: boolean;      // true = círculo, false = quadrado
    className?: string;
}

/** Hash djb2 — rápido, determinístico, bem distribuído para strings curtas */
function djb2(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return Math.abs(hash);
}

/** Gera a grade 5×5 espelhada a partir do hash */
function generateGrid(hash: number): boolean[][] {
    const grid: boolean[][] = [];
    let h = hash;
    for (let row = 0; row < 5; row++) {
        const rowData: boolean[] = [];
        for (let col = 0; col < 3; col++) {
            // bit extraído do hash determina se a célula está ativa
            rowData.push((h & 1) === 1);
            h = h >> 1;
        }
        // Espelha: col 3 = col 1, col 4 = col 0
        rowData.push(rowData[1]);
        rowData.push(rowData[0]);
        grid.push(rowData);
    }
    return grid;
}

export default function ProceduralAvatar({
    seed,
    size = 48,
    rankColor = '#dc2626',
    rounded = true,
    className = '',
}: ProceduralAvatarProps) {
    const hash = djb2(seed || 'default');
    const grid = generateGrid(hash);

    // Cor de fundo = versão escura do rankColor (hex com 20% opacidade simulada)
    const bgColor = `${rankColor}25`;
    const cellSize = size / 7; // 5 células + 1 padding em cada lado
    const padding = cellSize;

    const borderRadius = rounded ? size / 2 : size * 0.15;

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ flexShrink: 0 }}
        >
            {/* Background */}
            <rect
                width={size}
                height={size}
                fill={bgColor}
                rx={borderRadius}
                ry={borderRadius}
            />

            {/* Grid cells */}
            {grid.map((row, rowIdx) =>
                row.map((active, colIdx) =>
                    active ? (
                        <rect
                            key={`${rowIdx}-${colIdx}`}
                            x={padding + colIdx * cellSize}
                            y={padding + rowIdx * cellSize}
                            width={cellSize * 0.85}
                            height={cellSize * 0.85}
                            fill={rankColor}
                            rx={cellSize * 0.15}
                            opacity={0.9}
                        />
                    ) : null
                )
            )}
        </svg>
    );
}
