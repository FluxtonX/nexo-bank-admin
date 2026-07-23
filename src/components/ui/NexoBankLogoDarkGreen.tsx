import React from "react";

interface NexoBankLogoDarkGreenProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  showText?: boolean;
}

export function NexoBankLogoDarkGreen({
  className = "h-12 w-auto",
  width,
  height,
  showText = true,
}: NexoBankLogoDarkGreenProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={showText ? "0 0 200 160" : "0 0 200 110"}
      width={width}
      height={height}
      className={className}
      fill="none"
    >
      {/* Interlocking N & B Geometric Emblem */}
      <g stroke="#064e3b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
        {/* N Left Vertical Bar */}
        <line x1="60" y1="28" x2="60" y2="92" />

        {/* N Diagonal Stroke */}
        <line x1="60" y1="28" x2="100" y2="92" />

        {/* Shared Stem / N Right & B Left Vertical */}
        <line x1="100" y1="28" x2="100" y2="92" />

        {/* B Upper Loop */}
        <path d="M 100 28 C 132 28, 132 60, 100 60" />

        {/* B Lower Loop */}
        <path d="M 100 60 C 136 60, 136 92, 100 92" />
      </g>

      {/* Accent Dot in slightly lighter emerald */}
      <circle cx="132" cy="28" r="4" fill="#047857" />

      {/* Typography: NEXO BANK */}
      {showText && (
        <text
          x="100"
          y="132"
          textAnchor="middle"
          fill="#064e3b"
          fontSize="14"
          fontWeight="800"
          letterSpacing="0.32em"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        >
          NEXO BANK
        </text>
      )}
    </svg>
  );
}

export default NexoBankLogoDarkGreen;
