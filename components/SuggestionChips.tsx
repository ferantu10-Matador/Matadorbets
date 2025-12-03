import React from 'react';

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
  disabled: boolean;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onSelect, disabled }) => {
  const suggestions = [
    { label: '⚽ Partidos de Hoy', query: 'Analiza los partidos de fútbol más importantes de hoy. Busca cuotas y bajas.' },
    { label: '🔥 Value Bet del Día', query: 'Busca la mejor apuesta de valor (Value Bet) del día de hoy en cualquier liga principal.' },
    { label: '🇪🇸 La Liga', query: 'Analiza la jornada actual de La Liga española. Busca oportunidades de valor.' },
    { label: '🇬🇧 Premier League', query: 'Analiza la jornada actual de la Premier League inglesa. Busca oportunidades de valor.' },
    { label: '🇮🇹 Serie A', query: 'Analiza la jornada actual de la Serie A italiana.' },
    { label: '🇪🇺 Champions', query: 'Analiza los próximos partidos de Champions League.' },
  ];

  return (
    <div className="w-full overflow-x-auto pb-3 pt-2 no-scrollbar mask-gradient">
      <div className="flex gap-2 px-1">
        {suggestions.map((chip, index) => (
          <button
            key={index}
            onClick={() => onSelect(chip.query)}
            disabled={disabled}
            className={`
              whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
              ${disabled 
                ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed' 
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-rose-500 hover:text-rose-400 hover:bg-slate-800 active:scale-95 shadow-sm'
              }
            `}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};