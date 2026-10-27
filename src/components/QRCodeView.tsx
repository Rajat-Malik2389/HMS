import React from 'react';

interface QRCodeViewProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
}

/**
 * Procedural SVG matrix QR-code generator with high contrast clinical styling,
 * corner locator squares (finder patterns) and deterministic data matrix dots.
 */
export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 180,
  label,
  sublabel,
}) => {
  // Deterministically generate a 21x21 grid pattern based on string value
  const gridSize = 21;
  const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // 1. Draw 3 standard corner finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startY + r][startX + c] = isBorder || isCore;
      }
    }
  };

  drawFinder(0, 0); // Top-left
  drawFinder(gridSize - 7, 0); // Top-right
  drawFinder(0, gridSize - 7); // Bottom-left

  // 2. Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Fill payload area deterministically with string hash bits
  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip finder areas
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      seed = (seed * 1664525 + 1013904223) >>> 0;
      matrix[r][c] = (seed & 1) === 1;
    }
  }

  const cellSize = size / gridSize;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rounded-lg shadow-sm"
        aria-label={`QR Code for ${value}`}
      >
        <rect width={size} height={size} fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
      {label && <p className="mt-2 text-xs font-semibold text-slate-800 font-mono">{label}</p>}
      {sublabel && <p className="text-[10px] text-slate-500 font-mono">{sublabel}</p>}
    </div>
  );
};
