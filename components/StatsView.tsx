import React, { useState, useEffect, useMemo } from 'react';
import { Bet } from '../types';
import { Plus, Activity, DollarSign, Settings, Edit2, Trash2, PieChart as PieChartIcon, EyeOff, Link, ChevronDown, ChevronUp, BarChart2, TrendingDown } from 'lucide-react';
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
  Legend,
  BarChart,
  Bar
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
  const [expandedBets, setExpandedBets] = useState<string[]>([]);
  
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

  const toggleExpand = (id: string) => {
      setExpandedBets(prev => 
          prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
      );
  };

  const handleStatusChange = (id: string, newStatus: 'pending' | 'won' | 'lost') => {
      setBets(prev => prev.map(b => b.id === id ? { ...b, result: newStatus } : b));

      // Celebration Logic
      if (newStatus === 'won') {
        if (typeof window !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(200);
        }
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            colors: ['#10b981', '#fbbf24', '#34d399', '#F59E0B']
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

  // --- ANALYTICS CALCULATIONS ---

  const analytics = useMemo(() => {
    let currentBankroll = initialBankroll;
    let netProfit = 0;
    let totalInvested = 0;
    let maxBankroll = initialBankroll;
    let maxDrawdown = 0;

    // Sort bets for calculation
    const settledBets = [...bets].filter(b => b.result !== 'pending').sort((a, b) => a.date - b.date);

    settledBets.forEach(bet => {
      let profit = 0;
      if (bet.result === 'won') {
        profit = (bet.stake * bet.odds) - bet.stake;
        netProfit += profit;
        currentBankroll += profit;
      } else if (bet.result === 'lost') {
        netProfit -= bet.stake;
        currentBankroll -= bet.stake;
      }
      totalInvested += bet.stake;

      // Drawdown Calculation
      if (currentBankroll > maxBankroll) {
          maxBankroll = currentBankroll;
      }
      const drawdown = maxBankroll > 0 ? (maxBankroll - currentBankroll) / maxBankroll : 0;
      if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
      }
    });

    const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    const yieldVal = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0; 
    const avgProfitPerBet = settledBets.length > 0 ? netProfit / settledBets.length : 0;

    return {
      currentBankroll,
      netProfit,
      roi,
      yieldVal,
      maxDrawdown: maxDrawdown * 100,
      avgProfitPerBet,
      totalBetsCount: settledBets.length
    };
  }, [bets, initialBankroll]);

  // --- CHART DATA: EVOLUTION + PROJECTION ---
  const areaChartData = useMemo(() => {
    const sortedBets = [...bets].filter(b => b.result !== 'pending').sort((a, b) => a.date - b.date);
    let runningBankroll = initialBankroll;
    
    // Historical Data
    const data: any[] = [{ date: 'Inicio', value: initialBankroll, projected: null }];

    sortedBets.forEach((bet, idx) => {
      if (bet.result === 'won') {
        runningBankroll += (bet.stake * bet.odds) - bet.stake;
      } else if (bet.result === 'lost') {
        runningBankroll -= bet.stake;
      }
      data.push({
        date: idx + 1, // Simple index for X-axis to align projection
        realDate: new Date(bet.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
        value: Number(runningBankroll.toFixed(2)),
        projected: null
      });
    });

    // Forecast / Projection (Next 10 bets)
    if (analytics.totalBetsCount > 5) {
        // Start projection from the last real point
        const lastReal = data[data.length - 1];
        // Ensure the line connects
        data[data.length - 1].projected = lastReal.value;
        
        let projectedBankroll = lastReal.value;
        for (let i = 1; i <= 10; i++) {
            projectedBankroll += analytics.avgProfitPerBet;
            data.push({
                date: analytics.totalBetsCount + i,
                realDate: `Futuro +${i}`,
                value: null,
                projected: Number(projectedBankroll.toFixed(2))
            });
        }
    }

    return data;
  }, [bets, initialBankroll, analytics]);

  // --- CHART DATA: X-RAY (MARKET PERFORMANCE) ---
  const marketPerformanceData = useMemo(() => {
      const marketGroups: Record<string, number> = {
          '1X2': 0, 'GOALS': 0, 'BTTS': 0, 'HANDICAP': 0, 'CORNERS_CARDS': 0, 'PARLAY': 0, 'OTHER': 0
      };

      const settledBets = bets.filter(b => b.result !== 'pending');
      
      settledBets.forEach(bet => {
          let pnl = 0;
          if (bet.result === 'won') pnl = (bet.stake * bet.odds) - bet.stake;
          if (bet.result === 'lost') pnl = -bet.stake;
          
          const marketKey = bet.market || 'OTHER'; // Fallback for legacy bets
          if (marketGroups[marketKey] !== undefined) {
              marketGroups[marketKey] += pnl;
          } else {
              marketGroups['OTHER'] += pnl;
          }
      });

      // Filter out empty markets and map to array
      return Object.keys(marketGroups)
        .filter(key => marketGroups[key] !== 0)
        .map(key => ({
            name: key === 'PARLAY' ? 'Combinadas' : key === 'CORNERS_CARDS' ? 'Corners/Tarj' : key,
            value: Number(marketGroups[key].toFixed(2))
        }));
  }, [bets]);

  // --- CHART DATA: PIE ---
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
            <span className="w-1 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            Finanzas Matador
        </h2>
        
        <div className="flex gap-2">
            {isZenMode && (
                <div className="flex items-center gap-1 bg-purple-900/30 text-purple-400 px-2 py-1 rounded-lg text-xs font-bold border border-purple-500/30">
                    <EyeOff size={12} /> Zen
                </div>
            )}
            <button 
                onClick={() => setIsBankrollModalOpen(true)}
                className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 hover:bg-slate-800 hover:text-emerald-400 px-3 py-1.5 rounded-lg border border-slate-800 transition-all group"
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
            <p className={`text-lg font-bold font-mono ${analytics.currentBankroll >= initialBankroll ? 'text-emerald-400' : 'text-rose-400'} ${isZenMode ? 'blur-sm select-none' : ''}`}>
               {formatMoney(analytics.currentBankroll)}
            </p>
        </div>

        {/* Profit */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
             <div className="absolute -right-4 -top-4 bg-blue-500/10 w-16 h-16 rounded-full"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Neto</p>
            <p className={`text-lg font-bold font-mono ${analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} ${isZenMode ? 'blur-sm select-none' : ''}`}>
               {formatMoney(analytics.netProfit, true)}
            </p>
        </div>

        {/* YIELD */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 bg-orange-500/10 w-16 h-16 rounded-full"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">YIELD</p>
            <p className={`text-lg font-bold font-mono ${analytics.yieldVal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
               {analytics.yieldVal > 0 ? '+' : ''}{analytics.yieldVal.toFixed(2)}%
            </p>
        </div>

        {/* MAX DRAWDOWN */}
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 bg-rose-600/10 w-16 h-16 rounded-full"></div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Max Drawdown</p>
            <p className="text-lg font-bold font-mono text-rose-500 flex items-center gap-1">
               <TrendingDown size={14} />
               {analytics.maxDrawdown.toFixed(1)}%
            </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid md:grid-cols-2 gap-4">
          
          {/* 1. Main Projection Chart */}
          <div className="md:col-span-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-inner h-[300px]">
             <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-2">
                <Activity size={14} /> PROYECCIÓN DE TENDENCIA
             </h3>
             <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={areaChartData}>
                   <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <pattern id="patternStripes" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                         <line x1="0" y1="0" x2="8" y2="8" stroke="#06b6d4" strokeWidth="1" />
                      </pattern>
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
                      labelStyle={{ display: 'none' }}
                      formatter={(value: any, name: string) => [
                          isZenMode ? '**** €' : `${Number(value).toFixed(2)}€`, 
                          name === 'value' ? 'Real' : 'Proyección'
                      ]}
                   />
                   <ReferenceLine y={initialBankroll} stroke="#64748b" strokeDasharray="3 3" opacity={0.5} />
                   
                   {/* Real Data Line */}
                   <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      connectNulls={false}
                   />
                   
                   {/* Projection Line */}
                   <Area
                      type="monotone"
                      dataKey="projected"
                      stroke="#06b6d4" // Cyan
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={0.1}
                      fill="#06b6d4"
                      connectNulls={true}
                   />
                </AreaChart>
             </ResponsiveContainer>
          </div>

          {/* 2. X-Ray (Market Performance) */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-inner h-[280px]">
             <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                <BarChart2 size={14} /> RAYOS X (Por Mercado)
             </h3>
             <ResponsiveContainer width="100%" height="90%">
                <BarChart data={marketPerformanceData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80} 
                        tick={{fill: '#94a3b8', fontSize: 10}}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                         contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                         cursor={{fill: '#1e293b'}}
                         formatter={(value: any) => [isZenMode ? '***' : `${value}€`, 'Neto']}
                    />
                    <Bar dataKey="value" barSize={15} radius={[0, 4, 4, 0]}>
                        {marketPerformanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>

          {/* 3. Win Rate Pie Chart */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-inner h-[280px]">
             <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                <PieChartIcon size={14} /> TASA DE ACIERTO
             </h3>
             <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie
                        data={pieChartData}
                        innerRadius={50}
                        outerRadius={70}
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
             <h3 className="font-bold text-white text-sm">Últimos Movimientos</h3>
             <span className="text-[10px] text-slate-500">{bets.length} registros</span>
         </div>
         
         <div className="space-y-3">
             {bets.length === 0 ? (
                 <div className="text-center py-8 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                     <DollarSign size={24} className="mx-auto mb-2 opacity-50" />
                     <p className="text-sm">Registra tu primera apuesta para ver la magia.</p>
                 </div>
             ) : (
                 bets.map((bet) => {
                     const isCombined = bet.type === 'combined';
                     const isExpanded = expandedBets.includes(bet.id);
                     
                     return (
                     <div key={bet.id} className="group flex flex-col bg-slate-900 border border-slate-800 rounded-lg shadow-sm hover:border-slate-700 transition-colors">
                         <div className="p-3 flex justify-between items-center">
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                {/* Status Dot */}
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    bet.result === 'won' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                    bet.result === 'lost' ? 'bg-rose-500' :
                                    'bg-slate-600'
                                }`} />
                                
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        {bet.market && (
                                            <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30">
                                                {bet.market === 'CORNERS_CARDS' ? 'CORNERS' : bet.market}
                                            </span>
                                        )}
                                        {isCombined && (
                                            <span className="text-[9px] uppercase font-bold text-rose-400 bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-900/50 flex items-center gap-1">
                                                <Link size={8} /> PARLAY
                                            </span>
                                        )}
                                        <p className="text-white font-medium text-sm truncate flex-1">{bet.event}</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="font-mono text-slate-400">{new Date(bet.date).toLocaleDateString()}</span>
                                        <span>Stake: <span className={`text-slate-300 ${isZenMode ? 'blur-[2px]' : ''}`}>{isZenMode ? '***' : bet.stake + '€'}</span></span>
                                        <span>@ <span className="text-slate-300">{bet.odds}</span></span>
                                        {isCombined && (
                                            <button 
                                                onClick={() => toggleExpand(bet.id)}
                                                className="ml-auto text-slate-400 hover:text-white flex items-center gap-1 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded"
                                            >
                                                {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                Info
                                            </button>
                                        )}
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

                         {/* Expanded Selections */}
                         {isCombined && isExpanded && bet.selections && (
                             <div className="px-4 pb-3 pt-0 animate-fade-in">
                                 <div className="bg-slate-950/50 rounded-lg p-2 space-y-1.5 border border-slate-800/50">
                                     {bet.selections.map((sel, idx) => (
                                         <div key={idx} className="flex justify-between items-center text-xs text-slate-400">
                                             <span className="truncate flex-1 pr-2">▪ {sel.event}</span>
                                             <span className="font-mono text-slate-500">@{sel.odds}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                     </div>
                 )})
             )}
         </div>
      </div>

      {/* FAB - Floating Action Button */}
      <button
        onClick={() => setIsBetModalOpen(true)}
        className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-900/40 transition-all hover:scale-110 active:scale-95 z-40 flex items-center justify-center"
      >
        <Plus size={24} />
      </button>

      <AddBetModal 
        isOpen={isBetModalOpen}
        onClose={() => setIsBetModalOpen(false)}
        onSave={handleSaveBet}
        currentBankroll={analytics.currentBankroll}
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