"use client";
import React from "react";

export default function ScanProgress({ value, size=72 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2; // padding 4px
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);
  return (
    <svg width={size} height={size} role="img" aria-label={`Scan progress ${clamped}%`}>
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#db2777"/>
          <stop offset="50%" stopColor="#ec4899"/>
          <stop offset="100%" stopColor="#f472b6"/>
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={radius} stroke="#27272a" strokeWidth="8" fill="none" />
      <circle cx={size/2} cy={size/2} r={radius} stroke="url(#pg)" strokeWidth="8" fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="#f9a8d4">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
