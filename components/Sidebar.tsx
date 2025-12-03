import React from 'react';
import { MessageSquare, CalendarDays, BarChart2, X, ChevronRight } from 'lucide-react';
import { ViewType } from '../types';
import { MatadorLogo } from './MatadorLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onChangeView }) => {
  const menuItems = [
    { 
      id: 'chat' as ViewType, 
      label: 'El Matador', 
      icon: <MessageSquare size={20} />, 
      desc: 'Chat & Análisis IA' 
    },
    { 
      id: 'matches' as ViewType, 
      label: 'Cartelera', 
      icon: <CalendarDays size={20} />, 
      desc: 'Partidos de Hoy' 
    },
    { 
      id: 'stats' as ViewType, 
      label: 'Estadísticas', 
      icon: <BarChart2 size={20} />, 
      desc: 'Base de Datos (Beta)' 
    },
  ];

  const handleNavigation = (view: ViewType) => {
    onChangeView(view);
    onClose();
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-slate-950 border-r border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
           <div className="flex items-center gap-3">
              <MatadorLogo size={32} />
              <div>
                <h2 className="font-bold text-white text-lg leading-none">Matador<span className="text-rose-600">Bets</span></h2>
                <span className="text-[10px] text-slate-500 tracking-widest uppercase">Menú Principal</span>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
           >
             <X size={20} />
           </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-gradient-to-r from-rose-900/20 to-slate-900 border border-rose-900/50 shadow-lg' 
                    : 'hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className={`p-2.5 rounded-lg transition-colors ${
                  isActive ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : 'bg-slate-800 text-slate-400 group-hover:text-rose-400 group-hover:bg-slate-800'
                }`}>
                  {item.icon}
                </div>
                <div className="text-left flex-1">
                  <span className={`block font-bold text-sm ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400">
                    {item.desc}
                  </span>
                </div>
                {isActive && <ChevronRight size={16} className="text-rose-500" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-600">
                v2.0.0 &bull; Matador AI
            </p>
        </div>
      </div>
    </>
  );
};