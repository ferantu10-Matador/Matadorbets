import React, { useState } from 'react';

export const MatadorLogo: React.FC<{ size?: number, className?: string }> = ({ size = 40, className = "" }) => {
  const [error, setError] = useState(false);

  if (error) {
    // FALLBACK: Si no encuentra logo.png, dibuja este Toro Dorado por código
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Fondo Circular */}
        <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#f59e0b" strokeWidth="3" />
        
        {/* Cabeza Toro */}
        <path 
          d="M20 30 C 20 10, 40 20, 50 35 C 60 20, 80 10, 80 30 C 80 50, 70 60, 50 85 C 30 60, 20 50, 20 30 Z" 
          fill="url(#bullGradient)" 
          stroke="#b45309" 
          strokeWidth="2" 
        />
        
        {/* Cuernos */}
        <path d="M20 30 Q 10 10 30 5" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M80 30 Q 90 10 70 5" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Ojos Rojos */}
        <circle cx="38" cy="45" r="4" fill="#ef4444" />
        <circle cx="62" cy="45" r="4" fill="#ef4444" />
        
        {/* Puro */}
        <rect x="52" y="65" width="25" height="8" rx="2" fill="#78350f" transform="rotate(15 52 65)" stroke="#451a03" strokeWidth="1" />
        <circle cx="78" cy="72" r="3" fill="#ef4444" className="animate-pulse">
           <animate attributeName="opacity" values="0.5;1;0.5" duration="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Humo */}
        <path d="M80 65 Q 85 55 80 50 Q 75 45 85 40" stroke="#94a3b8" strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="4 4" />

        <defs>
          <linearGradient id="bullGradient" x1="20" y1="30" x2="80" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Matadorbets" 
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
      onError={() => setError(true)}
    />
  );
};