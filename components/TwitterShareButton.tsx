import React from 'react';
import { Twitter } from 'lucide-react';

interface TwitterShareButtonProps {
  matchTitle: string;
  analysisText: string;
}

export const TwitterShareButton: React.FC<TwitterShareButtonProps> = ({ matchTitle, analysisText }) => {
  
  const handleShare = () => {
    // 1. Limpieza básica de Markdown para que el tweet sea legible
    const cleanAnalysis = analysisText
        .replace(/[*_#`]/g, '') // Quitar negritas, cursivas, headers
        .replace(/\n{3,}/g, '\n\n') // Quitar saltos de línea excesivos
        .trim();

    // 2. Recortar para cumplir límites de Twitter (aprox 280 chars)
    // Dejamos espacio para el título y hashtags.
    const truncatedAnalysis = cleanAnalysis.length > 180 
        ? cleanAnalysis.substring(0, 180) + '...' 
        : cleanAnalysis;

    // 3. Construir el cuerpo del Tweet con "Actitud Matador"
    const tweetBody = `🐂 Matadorbets Análisis:\n\n⚽ ${matchTitle}\n\n📝 ${truncatedAnalysis}\n\n#MatadorBets #ApuestasDeportivas #BigData`;

    // 4. Abrir Intent
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetBody)}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-sky-400 border border-slate-700 hover:border-sky-500/50 rounded-lg transition-all duration-200 group flex items-center gap-2 active:scale-95 shadow-sm"
      title="Compartir en X (Twitter)"
      aria-label="Compartir en Twitter"
    >
      <Twitter size={20} className="group-hover:animate-pulse" />
      <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Postear</span>
    </button>
  );
};