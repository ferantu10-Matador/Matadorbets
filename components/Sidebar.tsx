import React, { useEffect, useState } from 'react';
import { MessageSquare, CalendarDays, BarChart2, X, ChevronRight, Settings, TrendingUp } from 'lucide-react';
import { ViewType, Bet } from '../types';
import { MatadorLogo } from './MatadorLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

interface UserRank {
  rank: string;
  emoji: string;
  progress: number;
  nextLevelBets: number;
  yieldVal: number;
  betsCount: number;
  isMatador: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onChangeView }) => {
  const [userStats, setUserStats] = useState<UserRank>({
    rank: 'Novato',
    emoji: '👶',
    progress: 0,
    nextLevelBets: 10,
    yieldVal: 0,
    betsCount: 0,
    isMatador: false
  });
  const [isMounted, setIsMounted] = useState(false);

  // Calculate Rank Logic on Mount/Open
  useEffect(() => {
    setIsMounted(true);
    
    // Safety check for localStorage
    if (typeof window === 'undefined') return;

    const calculateStats = () => {
        try {
            const savedBets = localStorage.getItem('matador_bets_history');
            const bets: Bet[] = savedBets ? JSON.parse(savedBets) : [];
            const totalBets = bets.length;
            
            // Calculate Yield
            let netProfit = 0;
            let totalInvested = 0;
            const settledBets = bets.filter(b => b.result !== 'pending');
            
            settledBets.forEach(bet => {
                if (bet.result === 'won') {
                    netProfit += (bet.stake * bet.odds) - bet.stake;
                } else if (bet.result === 'lost') {
                    netProfit -= bet.stake;
                }
                totalInvested += bet.stake;
            });
            
            const yieldVal = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

            // Determine Rank
            let rank = 'Novato';
            let emoji = '👶';
            let progress = 0;
            let nextLevelBets = 10;
            let isMatador = false;

            if (totalBets < 10) {
                // Novato
                rank = 'Novato';
                emoji = '👶';
                nextLevelBets = 10;
                progress = (totalBets / 10) * 100;
            } else if (totalBets < 50) {
                // Analista
                rank = 'Analista';
                emoji = '🧐';
                nextLevelBets = 50;
                progress = ((totalBets - 10) / (40)) * 100;
            } else {
                // High Volume
                if (totalBets >= 100 && yieldVal > 10) {
                    // EL MATADOR
                    rank = 'EL MATADOR';
                    emoji = '🐂';
                    isMatador = true;
                    progress = 100;
                    nextLevelBets = totalBets; // Maxed
                } else if (yieldVal > 0) {
                    // Profesional
                    rank = 'Profesional';
                    emoji = '💰';
                    nextLevelBets = 100;
                    progress = Math.min(((totalBets - 50) / (50)) * 100, 100);
                } else {
                    // Analista (High volume but bad yield)
                    rank = 'Analista';
                    emoji = '🧐';
                    nextLevelBets = 50; // Visual fix
                    progress = 100;
                }
            }

            setUserStats({
                rank,
                emoji,
                progress: Math.min(Math.max(progress, 0), 100),
                nextLevelBets,
                yieldVal,
                betsCount: totalBets,
                isMatador
            });

        } catch (e) {
            console.error("Error calculating user stats", e);
        }
    };

    if (isOpen) {
        calculateStats();
    }
  }, [isOpen]);

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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
            
            {/* GAMIFICATION USER CARD */}
            {isMounted && (
                <div className={`mb-6 rounded-2xl p-4 text-white relative overflow-hidden transition-all duration-500 ${
                    userStats.isMatador 
                        ? 'bg-gradient-to-br from-amber-900/40 to-black border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                        : 'bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700'
                }`}>
                    {/* Glow effect for Matador */}
                    {userStats.isMatador && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full -mr-10 -mt-10 animate-pulse"></div>}

                    <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 ${
                            userStats.isMatador ? 'bg-amber-950 border-amber-500' : 'bg-slate-800 border-slate-600'
                        }`}>
                            {userStats.emoji}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Tu Rango</p>
                            <h3 className={`font-bold text-lg leading-none ${userStats.isMatador ? 'text-amber-400' : 'text-white'}`}>
                                {userStats.rank}
                            </h3>
                        </div>
                    </div>

                    <div className="space-y-1 relative z-10">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>Progreso</span>
                            <span>{userStats.betsCount} / {userStats.nextLevelBets} apuestas</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    userStats.isMatador ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${userStats.progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5 relative z-10">
                        <TrendingUp size={14} className={userStats.yieldVal >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                        <span className="text-xs font-mono text-slate-300">
                            Yield Actual: <span className={userStats.yieldVal >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {userStats.yieldVal > 0 ? '+' : ''}{userStats.yieldVal.toFixed(2)}%
                            </span>
                        </span>
                    </div>
                </div>
            )}

            {/* Menu Buttons */}
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

        {/* Footer / Settings */}
        <div className="p-4 border-t border-slate-800">
           <button
                onClick={() => handleNavigation('settings')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent ${
                   currentView === 'settings' 
                   ? 'bg-slate-900 text-white border-slate-700' 
                   : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
            >
               <Settings size={18} />
               <div className="text-left flex-1">
                   <span className="block text-sm font-semibold">Ajustes / Datos</span>
                   <span className="text-[10px] text-slate-500">Backup & Restore</span>
               </div>
            </button>
        </div>
      </div>
    </>
  );
};