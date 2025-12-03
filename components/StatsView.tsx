import React, { useState, useEffect, useMemo } from 'react';
import { Bet } from '../types';
import { Plus, Activity, DollarSign, Settings, Edit2, Trash2, PieChart as PieChartIcon, EyeOff } from 'lucide-react';
import { AddBetModal } from './AddBetModal';
import { EditBankrollModal } from './EditBankrollModal';
import confetti from 'canvas-confetti';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const STORAGE_KEY_BETS = 'matador_bets_history';
const STORAGE_KEY_CONFIG = 'matador_bankroll_config';
const STORAGE_KEY_ZEN = 'matador_hide_balance';

// Colors for Pie Chart
const COLORS = ['#10b981', '#f43f5e', '#64748b']; // Green, Red, Gray

export const StatsView: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [initialBankroll, setInitialBankroll] = useState(1000);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [isBankrollModalOpen, setIsBankrollModalOpen] = useState(false);

  // Load Data
  useEffect(() => {
    // Bets
    const savedBets = localStorage.getItem(STORAGE_KEY_BETS);
    if (savedBets) {
      try {
        setBets(JSON.parse(savedBets));
      } catch (e) {
        console.error("Error parsing bets history", e);
      }
    }

    // Config
    const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            if (config && typeof config.initial === 'number') {
                setInitialBankroll(config.initial);
            }
        } catch (e) {
            console.error("Error parsing config", e);
        }
    }

    // Zen Mode
    const zenSetting = localStorage.getItem(STORAGE_KEY_ZEN);
    setIsZenMode(zenSetting === 'true');

    setIsLoaded(true);
  }, []);

  // Save Data
  useEffect(() => {
    if (isLoaded) {
        localStorage.setItem(STORAGE_KEY_BETS, JSON.stringify(bets));
    }
  }, [bets, isLoaded]);

  const handleSaveBankroll = (newAmount: number) => {
      setInitialBankroll(newAmount);
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ initial: newAmount }));
  };

  const handleSaveBet = (newBetData: Omit<Bet, 'id' | 'date'>) => {
    const newBet: Bet = {
      ...newBetData,
      id: Date.now().toString(),
      date: Date.now()
    };
    setBets(prev => [newBet, ...prev]);
  };

  const handleDeleteBet = (id: string) => {
    if(window.confirm("¿Eliminar este registro?")) {
        setBets(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: 'pending' | 'won' | 'lost') => {
      setBets(prev => prev.map(b => b.id === id ? { ...b, result: newStatus } : b));

      // Celebration Logic
      if (newStatus === 'won') {
        // 1. Haptic Feedback
        if (typeof window !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
        }

        // 2. Confetti Explosion
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            colors: ['#10b981', '#fbbf24', '#34d399', '#F59E0B'] // Emerald & Gold
        };

        function fire(particleRatio: number, opts: any) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.20, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.10, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.10, { spread: 120, startVelocity: 45 });
      }
  };

  // Calculate KPIs
  const stats = useMemo(() => {
    let currentBankroll = initialBankroll;
    let netProfit = 0;
    let totalInvested = 0;

    // Filter settled bets for calculations
    const settledBets = bets.filter(b => b.result !== 'pending');

    settledBets.forEach(bet => {
      if (bet.result === 'won') {
        const profit = (bet.stake * bet.odds) - bet.stake;
        netProfit += profit;
        currentBankroll += profit;
      } else if (bet.result === 'lost') {
        netProfit -= bet.stake;
        currentBankroll -= bet.stake;
      }
      totalInvested += bet.stake;
    });

    const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    const yieldVal = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0; 

    return {
      currentBankroll,
      netProfit,
      roi,
      yieldVal
    };
  }, [bets, initialBankroll]);

  // Area Chart Data (Bankroll Evolution)
  const areaChartData = useMemo(() => {
    const sortedBets = [...bets].filter(b => b.result !== 'pending').sort((a, b) => a.date - b.date);
    let runningBankroll = initialBankroll;
    const data = [{ date: 'Inicio', value: initialBankroll }];

    sortedBets.forEach(bet => {
      if (bet.result === 'won') {
        runningBankroll += (bet.stake * bet.odds) - bet.stake;
      } else if (bet.result === 'lost') {
        runningBankroll -= bet.stake;
      }
      data.push({
        date: new Date(bet.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
        value: Number(runningBankroll.toFixed(2))
      });
    });
    return data;
  }, [bets, initialBankroll]);

  // Pie Chart Data (Win Rate Distribution)
  const pieChartData = useMemo(() => {
      const won = bets.filter(b => b.result === 'won').length;
      const lost = bets.filter(b => b.result === 'lost').length;
      const pending = bets.filter(b => b.result === 'pending').length;
      return [
          { name: 'Ganadas', value: won },
          { name: 'Perdidas', value: lost },
          { name: 'Pendientes', value: pending },
      ];
  }, [bets]);

  const formatMoney = (amount: number, forceSign: boolean = false) => {
      if (isZenMode) return '**** €';
      const formatted = amount.toFixed(0);
      const sign = amount > 0 && forceSign ? '+' : '';
      return `${sign}${formatted}€`;
  };

  if (!isLoaded) return null;

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
            Gestión de Cartera
        </h2>
        
        <div className="flex gap-2">
            {isZenMode && (
                <div className="flex items-center gap-1 bg-purple-900/30 text-purple-400 px-2 py-1 rounded-lg text-xs font-bold border border-purple-500/30">
                    <EyeOff size={12} /> Zen
                </div>
            )}
            <button 
                onClick={() => setIsBankrollModalOpen(true)}
                className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 hover:bg-slate-800 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-slate-800 transition-all group"
            >
            <Settings size={12} className="group-hover:rotate-45 transition-transform" />
            Inicio: {formatMoney(initialBankroll)}
            <Edit2 size={10} className="opacity-50" />
            </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Bankroll */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 bg-emerald-500/10 w-16 h-16 rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Bankroll</p>
            <p className={`text-lg font-bold font-mono ${stats.currentBankroll >= initialBankroll ? 'text-emerald-400' : 'text-rose-400'} ${isZenMode ? 'blur-sm select-none' : ''}`}>
               {formatMoney(stats.currentBankroll)}
            </p>
        </div>

        {/* Profit */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
             <div className="absolute -right-4 -top-4 bg-blue-500/10 w-16 h-16 rounded-full"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Neto</p>
            <p className={`text-lg font-bold font-mono ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} ${isZenMode ? 'blur-sm select-none' : ''}`}>
               {formatMoney(stats.netProfit, true)}
            </p>
        </div>

        {/* ROI */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 bg-purple-500/10 w-16 h-16 rounded-full"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">ROI</p>
            <p className={`text-lg font-bold font-mono ${stats.roi >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
               {stats.roi.toFixed(1)}%
            </p>
        </div>

        {/* YIELD */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 bg-orange-500/10 w-16 h-16 rounded-full"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">YIELD</p>
            <p className={`text-lg font-bold font-mono ${stats.yieldVal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
               {stats.yieldVal > 0 ? '+' : ''}{stats.yieldVal.toFixed(2)}%
            </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-3 gap-4">
          {/* Line Chart */}
          <div className="md:col-span-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-inner h-[280px]">
             <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-2">
                <Activity size={14} /> EVOLUCIÓN BANKROLL
             </h3>
             <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={areaChartData}>
                   <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                   <XAxis 
                      dataKey="date" 
                      tick={{fill: '#64748b', fontSize: 10}} 
                      axisLine={false} 
                      tickLine={false}
                      minTickGap={30}
                   />
                   <YAxis 
                      domain={['auto', 'auto']} 
                      tick={{fill: '#64748b', fontSize: 10}} 
                      axisLine={false} 
                      tickLine={false}
                      width={35}
                      tickFormatter={(value) => isZenMode ? '***' : value}
                   />
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#10b981' }}
                      labelStyle={{ display: 'none' }}
                      formatter={(value: any) => [isZenMode ? '**** €' : `${value}€`, 'Bankroll']}
                   />
                   <ReferenceLine y={initialBankroll} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                   <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                   />
                </AreaChart>
             </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-inner h-[280px]">
             <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                <PieChartIcon size={14} /> DISTRIBUCIÓN
             </h3>
             <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie
                        data={pieChartData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip 
                         contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                         itemStyle={{ color: '#fff' }}
                    />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    />
                </PieChart>
             </ResponsiveContainer>
          </div>
      </div>

      {/* Bets History List */}
      <div>
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-white text-sm">Últimas Apuestas</h3>
             <span className="text-[10px] text-slate-500">{bets.length} registros</span>
         </div>
         
         <div className="space-y-3">
             {bets.length === 0 ? (
                 <div className="text-center py-8 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                     <DollarSign size={24} className="mx-auto mb-2 opacity-50" />
                     <p className="text-sm">Registra tu primera apuesta para ver la magia.</p>
                 </div>
             ) : (
                 bets.map((bet) => (
                     <div key={bet.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex justify-between items-center shadow-sm hover:border-slate-700 transition-colors group">
                         <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                             {/* Status Dot */}
                             <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                 bet.result === 'won' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                 bet.result === 'lost' ? 'bg-rose-500' :
                                 'bg-slate-600'
                             }`} />
                             
                             <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                     {bet.sport && (
                                         <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                             {bet.sport === 'football' ? 'FUT' : bet.sport === 'basketball' ? 'BAL' : bet.sport === 'tennis' ? 'TEN' : bet.sport === 'esports' ? 'ESP' : 'GEN'}
                                         </span>
                                     )}
                                     <p className="text-white font-medium text-sm truncate">{bet.event}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                     <span className="font-mono text-slate-400">{new Date(bet.date).toLocaleDateString()}</span>
                                     <span>Stake: <span className={`text-slate-300 ${isZenMode ? 'blur-[2px]' : ''}`}>{isZenMode ? '***' : bet.stake + '€'}</span></span>
                                     <span>@ <span className="text-slate-300">{bet.odds}</span></span>
                                </div>
                             </div>
                         </div>
                         
                         <div className="flex items-center gap-2">
                             <select 
                                value={bet.result}
                                onChange={(e) => handleStatusChange(bet.id, e.target.value as any)}
                                className={`text-[10px] font-bold uppercase px-2 py-1.5 rounded cursor-pointer outline-none border border-transparent transition-colors appearance-none text-center min-w-[70px] ${
                                    bet.result === 'won' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' :
                                    bet.result === 'lost' ? 'bg-rose-950/30 text-rose-400 border-rose-900/50' :
                                    'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                             >
                                 <option value="pending">⏳ Pend.</option>
                                 <option value="won">✅ Ganada</option>
                                 <option value="lost">❌ Perdida</option>
                             </select>
                             
                             <button 
                                onClick={() => handleDeleteBet(bet.id)}
                                className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-950/30 rounded-lg transition-all"
                                title="Eliminar apuesta"
                             >
                                <Trash2 size={16} />
                             </button>
                         </div>
                     </div>
                 ))
             )}
         </div>
      </div>

      {/* FAB - Floating Action Button */}
      <button
        onClick={() => setIsBetModalOpen(true)}
        className="fixed bottom-6 right-6 bg-rose-600 hover:bg-rose-500 text-white p-4 rounded-full shadow-lg shadow-rose-900/40 transition-all hover:scale-110 active:scale-95 z-40 flex items-center justify-center"
      >
        <Plus size={24} />
      </button>

      <AddBetModal 
        isOpen={isBetModalOpen}
        onClose={() => setIsBetModalOpen(false)}
        onSave={handleSaveBet}
      />

      <EditBankrollModal 
        isOpen={isBankrollModalOpen}
        onClose={() => setIsBankrollModalOpen(false)}
        currentBankroll={initialBankroll}
        onSave={handleSaveBankroll}
      />
    </div>
  );
};