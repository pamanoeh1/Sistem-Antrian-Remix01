import React from 'react';
import { QueueItem, CompanyProfile } from '../types/queue';

/**
 * Generates an SVG pseudo-barcode (Code 128 style) for thermal receipt printing
 */
export function generateBarcodeSvg(value: string): string {
  // Deterministic bar widths based on char codes
  let x = 10;
  const bars: { x: number; width: number }[] = [];
  const hash = value.split('').map((c) => c.charCodeAt(0));

  for (let i = 0; i < 38; i++) {
    const val = (hash[i % hash.length] * (i + 13)) % 10;
    const barWidth = val > 6 ? 3 : val > 3 ? 2 : 1;
    bars.push({ x, width: barWidth });
    const spaceWidth = (val % 3) + 1;
    x += barWidth + spaceWidth;
  }

  const totalWidth = x + 10;
  const barElements = bars
    .map((b) => `<rect x="${b.x}" y="0" width="${b.width}" height="45" fill="#000000" />`)
    .join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 58" class="w-full h-12 max-w-[200px] mx-auto">
      ${barElements}
      <text x="${totalWidth / 2}" y="56" font-family="monospace" font-size="9" text-anchor="middle" fill="#000000">${value}</text>
    </svg>
  `;
}

/**
 * Generates a clean 2D QR Code style SVG for ticket validation
 */
export function generateQrCodeSvg(value: string): string {
  // 17x17 grid simulation with corner positioning squares
  const size = 19;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to draw corner finder patterns (7x7)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0); // Top-left
  drawFinder(size - 7, 0); // Top-right
  drawFinder(0, size - 7); // Bottom-left

  // Fill pseudo-random patterns using value hash
  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) & 0xffffffff;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= size - 8;
      const inBL = r >= size - 8 && c < 8;
      if (!inTL && !inTR && !inBL) {
        seed = (seed * 1664525 + 1013904223) & 0xffffffff;
        matrix[r][c] = (seed & 1) === 1;
      }
    }
  }

  const cellSize = 4;
  const padding = 4;
  const svgSize = size * cellSize + padding * 2;
  const cells: string[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        cells.push(
          `<rect x="${padding + c * cellSize}" y="${padding + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000000" />`
        );
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" class="w-16 h-16 mx-auto">
      <rect width="${svgSize}" height="${svgSize}" fill="#ffffff" />
      ${cells.join('')}
    </svg>
  `;
}

/**
 * Triggers standard thermal printing using window.print()
 */
export function triggerPrint(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
