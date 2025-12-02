import React from 'react';

export const MatadorLogo: React.FC<{ size?: number, className?: string }> = ({ size = 40, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" className="fill-slate-900 stroke-red-600" strokeWidth="2" />
      
      {/* Bull Head Shape */}
      <path 
        d="M20 30 C 20 10, 35 15, 50 25 C 65 15, 80 10, 80 30 C 80 50, 65 80, 50 90 C 35 80, 20 50, 20 30 Z" 
        className="fill-red-700 stroke-red-500" 
        strokeWidth="2"
      />
      
      {/* Horns */}
      <path d="M20 30 Q 10 10 30 5" className="stroke-slate-200 fill-none" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 30 Q 90 10 70 5" className="stroke-slate-200 fill-none" strokeWidth="4" strokeLinecap="round" />

      {/* Eyes (Menacing) */}
      <path d="M35 45 L 45 50" className="stroke-slate-900" strokeWidth="3" />
      <path d="M65 45 L 55 50" className="stroke-slate-900" strokeWidth="3" />

      {/* Nose Ring */}
      <circle cx="50" cy="75" r="4" className="stroke-amber-400 fill-none" strokeWidth="2" />

      {/* The Cigar */}
      <rect x="55" y="65" width="20" height="6" rx="1" transform="rotate(-15 55 65)" className="fill-amber-700" />
      <rect x="72" y="60" width="4" height="6" rx="1" transform="rotate(-15 72 60)" className="fill-gray-400" /> {/* Ash */}
      
      {/* Smoke */}
      <path 
        d="M78 55 Q 85 50 82 45 T 88 35" 
        className="stroke-gray-400 opacity-60" 
        strokeWidth="2" 
        fill="none"
        strokeDasharray="4 2"
      />
    </svg>
  );
};