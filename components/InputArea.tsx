import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="sticky bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 p-4 z-10">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="relative flex-grow">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta al Matador (Ej: Real Madrid vs Barça, tarjetas y córners...)"
              className="w-full bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-2xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none max-h-[150px] scrollbar-hide shadow-inner"
              rows={1}
              disabled={isLoading}
            />
            <div className="absolute right-3 bottom-3 text-slate-400">
               {isLoading && <span className="animate-pulse text-xs text-rose-500 font-semibold">Analizando...</span>}
            </div>
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
              <Sparkles className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
        <p className="text-center text-xs text-slate-600 mt-2">
          Matadorbets usa IA + Google. Apuesta con responsabilidad. +18
        </p>
      </div>
    </div>
  );
};