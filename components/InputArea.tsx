import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { SuggestionChips } from './SuggestionChips';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const LOADING_MESSAGES = [
  "🐂 El Matador está estudiando las cuotas...",
  "📊 Analizando xG y estadísticas...",
  "🔍 Buscando valor en el mercado...",
  "📞 Consultando fuentes en Londres...",
  "🚑 Revisando partes médicos de última hora...",
  "🧮 Calculando probabilidades reales...",
  "⚖️ Comparando líneas de hándicap asiático...",
  "💣 Detectando ineficiencias en las bookies..."
];

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Rotating loading messages
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      // Set initial random message
      setLoadingText(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      
      // Rotate every 2.5 seconds
      interval = setInterval(() => {
        setLoadingText(prev => {
          const currentIndex = LOADING_MESSAGES.indexOf(prev);
          const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
          // To make it random instead of sequential, uncomment below:
          // return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
          return LOADING_MESSAGES[nextIndex];
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleSuggestionSelect = (text: string) => {
    if (!isLoading) {
      onSendMessage(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 pb-4 pt-2 px-4 z-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        
        {/* Loading Indicator Overlay (Mobile Friendly) */}
        {isLoading && (
          <div className="absolute -top-10 left-0 right-0 flex justify-center animate-fade-in px-4">
             <div className="bg-slate-900/90 border border-rose-500/30 text-rose-200 text-xs py-1.5 px-4 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-rose-500" />
                <span className="animate-pulse font-medium">{loadingText}</span>
             </div>
          </div>
        )}
        
        {/* Quick Actions / Suggestion Chips */}
        <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
           <SuggestionChips onSelect={handleSuggestionSelect} disabled={isLoading} />
        </div>

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="relative flex-grow">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Esperando análisis..." : "Pregunta al Matador (Ej: Real Madrid vs Barça...)"}
              className={`w-full bg-slate-900 text-white placeholder-slate-500 border rounded-2xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none max-h-[150px] scrollbar-hide shadow-inner text-sm md:text-base transition-all
                ${isLoading ? 'border-slate-800 opacity-60 cursor-not-allowed text-slate-400' : 'border-slate-700'}`}
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-full flex items-center justify-center transition-all duration-200 ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-900/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isLoading ? (
              <Sparkles className="animate-spin text-rose-500" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-600 mt-1">
          Matadorbets usa IA + Google. Apuesta con responsabilidad. +18
        </p>
      </div>
    </div>
  );
};