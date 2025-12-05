import React from 'react';
import { X, Trophy, Clock, Calendar } from 'lucide-react';
import { Match } from '../types';
import { MessageBubble } from './MessageBubble';
import { TwitterShareButton } from './TwitterShareButton';

interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ isOpen, onClose, match }) => {
  if (!isOpen || !match || !match.analysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700 bg-slate-950 flex justify-between items-start shrink-0">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                    {match.league}
                </span>
                <span className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                    <Clock size={12} /> {match.time}
                </span>
             </div>
             <h2 className="text-xl md:text-2xl font-bold text-white leading-tight pr-4">
                {match.home} <span className="text-slate-500 text-lg">vs</span> {match.away}
             </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <TwitterShareButton 
                matchTitle={`${match.home} vs ${match.away}`} 
                analysisText={match.analysis} 
            />
            
            <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-600"
                aria-label="Cerrar"
            >
                <X size={20} />
            </button>
          </div>
        </div>

        {/* Content - Reusing MessageBubble for Markdown rendering */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
           <MessageBubble 
              message={{
                  id: 'modal-analysis',
                  role: 'model', // Ensures Matador styling
                  text: match.analysis,
                  timestamp: new Date(),
                  groundingChunks: match.groundingChunks
              }} 
           />
        </div>
      </div>
    </div>
  );
};