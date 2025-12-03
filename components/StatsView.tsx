import React, { useState, useEffect, useMemo } from 'react';
import { Bet } from '../types';
import { Plus, Activity, DollarSign, Settings, Edit2 } from 'lucide-react';
import { AddBetModal } from './AddBetModal';
import { EditBankrollModal } from './EditBankrollModal';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const STORAGE_KEY_BETS = 'matador_bets_history';
const STORAGE_KEY_CONFIG = 'matador_bankroll_config';

export const StatsView: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [initialBankroll, setInitialBankroll] = useState(1000);
  
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
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BETS, JSON.stringify(bets));
  }, [bets]);

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

    return {
      currentBankroll,
      netProfit,
      roi
    };
  }, [bets, initialBankroll]);

  // Prepare Chart Data
  const chartData = useMemo(() => {
    // Sort bets chronologically oldest first for the graph
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

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
            Gestión de Cartera
        </h2>
        
        <button 
            onClick={() => setIsBankrollModalOpen(true)}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 hover:bg-slate-800 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-slate-800 transition-all group"
        >
           <Settings size={12} className="group-hover:rotate-45 transition-transform" />
           Inicio: {initialBankroll}€
           <Edit2 size={10} className="opacity-50" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Bankroll */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 bg-emerald-500/10 w-16 h-16 rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Bankroll</p>
            <p className={`text-lg md:text-xl font-bold font-mono ${stats.currentBankroll >= initialBankroll ? 'text-emerald-400' : 'text-rose-400'}`}>
               {stats.currentBankroll.toFixed(0)}€
            </p>
        </div>

        {/* Profit */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
             <div className="absolute -right-4 -top-4 bg-blue-500/10 w-16 h-16 rounded-full"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Neto</p>
            <p className={`text-lg md:text-xl font-bold font-mono ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {stats.netProfit > 0 ? '+' : ''}{stats.netProfit.toFixed(0)}€
            </p>
        </div>

        {/* ROI */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 bg-purple-500/10 w-16 h-16 rounded-full"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">ROI</p>
            <p className={`text-lg md:text-xl font-bold font-mono ${stats.roi >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
               {stats.roi.toFixed(1)}%
            </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-inner h-[250px] w-full">
         <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-2">
            <Activity size={14} /> RENDIMIENTO
         </h3>
         <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
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
               />
               <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: any) => [`${value}€`, 'Bankroll']}
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

      {/* Bets History */}
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
                     <div key={bet.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex justify-between items-center shadow-sm hover:border-slate-700 transition-colors">
                         <div className="flex-1 min-w-0 pr-4">
                             <p className="text-white font-medium text-sm truncate">{bet.event}</p>
                             <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                 <span className="font-mono text-slate-400">{new Date(bet.date).toLocaleDateString()}</span>
                                 <span>Stake: <span className="text-slate-300">{bet.stake}€</span></span>
                                 <span>@ <span className="text-slate-300">{bet.odds}</span></span>
                             </div>
                         </div>
                         
                         <div className="flex flex-col items-end gap-1">
                             <select 
                                value={bet.result}
                                onChange={(e) => handleStatusChange(bet.id, e.target.value as any)}
                                className={`text-[10px] font-bold uppercase px-2 py-1 rounded cursor-pointer outline-none border border-transparent hover:border-slate-600 transition-colors ${
                                    bet.result === 'won' ? 'bg-emerald-950/30 text-emerald-400' :
                                    bet.result === 'lost' ? 'bg-rose-950/30 text-rose-400' :
                                    'bg-slate-800 text-slate-400'
                                }`}
                             >
                                 <option value="pending">Pendiente</option>
                                 <option value="won">Ganada</option>
                                 <option value="lost">Perdida</option>
                             </select>
                             <button 
                                onClick={() => handleDeleteBet(bet.id)}
                                className="text-[10px] text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                Eliminar
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