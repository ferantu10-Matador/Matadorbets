import React from 'react';
import { MessageSquare, CalendarDays } from 'lucide-react';
import { ViewType } from '../types';

interface BottomNavProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  return (
    <div className="flex-shrink-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 pb-safe pt-2 px-6 z-30">
      <div className="max-w-md mx-auto flex justify-around items-center">
        <button
          onClick={() => onChangeView('chat')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 w-24 ${
            currentView === 'chat' 
              ? 'text-rose-500 scale-105' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className={`p-1.5 rounded-full ${currentView === 'chat' ? 'bg-rose-500/10' : 'bg-transparent'}`}>
             <MessageSquare size={24} strokeWidth={currentView === 'chat' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">EL MATADOR</span>
        </button>

        <div className="h-8 w-[1px] bg-slate-800 rounded-full mx-2"></div>

        <button
          onClick={() => onChangeView('matches')}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 w-24 ${
            currentView === 'matches' 
              ? 'text-emerald-400 scale-105' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
           <div className={`p-1.5 rounded-full ${currentView === 'matches' ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
            <CalendarDays size={24} strokeWidth={currentView === 'matches' ? 2.5 : 2} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">CARTELERA</span>
        </button>
      </div>
    </div>
  );
};