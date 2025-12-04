import React from 'react';

export const MatadorLogo: React.FC<{ size?: number, className?: string }> = ({ size = 40, className = "" }) => {
  return (
    <img 
      src="/logo.png" 
      alt="Matadorbets Logo" 
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
    />
  );
};