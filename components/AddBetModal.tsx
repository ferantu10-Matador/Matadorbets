import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Link, Calculator, TrendingUp } from 'lucide-react';
import { Bet, BetSelection, BetMarket } from '../types';

interface AddBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bet: Omit<Bet, 'id' | 'date'>) => void;
  currentBankroll: number;
}

export const AddBetModal: React.FC<AddBetModalProps> = ({ isOpen, onClose, onSave, currentBankroll }) => {
  const [betType, setBetType] = useState<'simple' | 'combined'>('simple');
  const [event, setEvent] = useState('');
  const [market, setMarket] = useState<BetMarket>('1X2');
  const [stake, setStake] = useState('');
  const [odds, setOdds] = useState('');
  const [result, setResult] = useState<'pending' | 'won' | 'lost'>('pending');
  
  // Kelly Calculator State
  const [showKelly, setShowKelly] = useState(false);
  const [confidence, setConfidence] = useState(50);
  const [kellySuggestion, setKellySuggestion] = useState<number | null>(null);

  // Combined Bets State
  const [selections, setSelections] = useState<Omit<BetSelection, 'id'>[]>([
      { event: '', odds: 0 },
      { event: '', odds: 0 }
  ]);

  // Auto-calculate total odds for combined bets
  useEffect(() => {
    if (betType === 'combined') {
        const total = selections.reduce((acc, curr) => {
            return acc * (curr.odds > 0 ? curr.odds : 1);
        }, 1);
        if (total > 1 && selections.some(s => s.odds > 0)) {
            setOdds(total.toFixed(2));
        } else {
            setOdds('');
        }
    }
  }, [selections, betType]);

  // Kelly Calculation Logic
  useEffect(() => {
      if (showKelly && odds && parseFloat(odds) > 1 && currentBankroll > 0) {
          const b = parseFloat(odds) - 1; // Net odds
          const p = confidence / 100; // Probability (0.55)
          const q = 1 - p; // Loss Probability
          
          // Full Kelly Formula
          const f = (b * p - q) / b;
          
          // Fractional Kelly (1/4) - Safer for sports betting
          const fraction = 0.25;
          const safeF = f * fraction;

          if (safeF > 0) {
              const suggestedStake = currentBankroll * safeF;
              setKellySuggestion(parseFloat(suggestedStake.toFixed(2)));
          } else {
              setKellySuggestion(0);
          }
      } else {
          setKellySuggestion(null);
      }
  }, [odds, confidence, showKelly, currentBankroll]);

  const applyKelly = () => {
      if (kellySuggestion !== null && kellySuggestion > 0) {
          setStake(kellySuggestion.toString());
      }
  };

  if (!isOpen) return null;

  const handleAddSelection = () => {
      setSelections([...selections, { event: '', odds: 0 }]);
  };

  const handleRemoveSelection = (index: number) => {
      if (selections.length > 1) {
          const newSelections = [...selections];
          newSelections.splice(index, 1);
          setSelections(newSelections);
      }
  };

  const handleSelectionChange = (index: number, field: 'event' | 'odds', value: string) => {
      const newSelections = [...selections];
      if (field === 'event') {
          newSelections[index].event = value;
      } else {
          newSelections[index].odds = parseFloat(value) || 0;
      }
      setSelections(newSelections);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stake || !odds) return;

    if (betType === 'simple' && !event) return;
    if (betType === 'combined' && selections.some(s => !s.event || s.odds <= 0)) return;

    const finalEventName = betType === 'simple' 
        ? event 
        : `Combinada (${selections.length} sel.)`;

    const finalSelections: BetSelection[] | undefined = betType === 'combined' 
        ? selections.map((s, i) => ({ id: `sel-${Date.now()}-${i}`, event: s.event, odds: s.odds }))
        : undefined;

    const finalMarket = betType === 'combined' ? 'PARLAY' : market;

    onSave({
      event: finalEventName,
      type: betType,
      selections: finalSelections,
      sport: 'football', // Default to football now
      market: finalMarket,
      stake: parseFloat(stake),
      odds: parseFloat(odds),
      result
    });
    
    // Reset form
    setEvent('');
    setStake('');
    setOdds('');
    setMarket('1X2');
    setResult('pending');
    setSelections([{ event: '', odds: 0 }, { event: '', odds: 0 }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950 shrink-0">
          <h3 className="font-bold text-white text-lg">Registrar Apuesta</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
            <button 
                onClick={() => setBetType('simple')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${
                    betType === 'simple' 
                        ? 'text-emerald-500 border-b-2 border-emerald-500 bg-slate-800/50' 
                        : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                Simple
            </button>
            <button 
                onClick={() => setBetType('combined')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                    betType === 'combined' 
                        ? 'text-rose-500 border-b-2 border-rose-500 bg-slate-800/50' 
                        : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <Link size={14} /> Combinada
            </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Market Selector (Only for Simple) */}
          {betType === 'simple' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mercado de Fútbol</label>
                <select
                   value={market}
                   onChange={(e) => setMarket(e.target.value as BetMarket)}
                   className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                    <option value="1X2">🏆 Ganador del Partido (1X2)</option>
                    <option value="GOALS">⚽ Goles (Over/Under)</option>
                    <option value="BTTS">🥅 Ambos Marcan (BTTS)</option>
                    <option value="HANDICAP">⚖️ Hándicap Asiático</option>
                    <option value="CORNERS_CARDS">🚩 Córners / Tarjetas</option>
                    <option value="OTHER">🎲 Otro / Especial</option>
                </select>
              </div>
          )}

          {/* EVENTS INPUT */}
          {betType === 'simple' ? (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Partido</label>
                <input
                  type="text"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  placeholder="Ej: Real Madrid vs City"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
          ) : (
              <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex justify-between items-center">
                      <span>Selecciones ({selections.length})</span>
                      <span className="text-[10px] text-slate-500 font-normal">Multiplica Cuotas</span>
                  </label>
                  
                  {selections.map((sel, idx) => (
                      <div key={idx} className="flex gap-2 items-start animate-fade-in">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                              <input
                                  type="text"
                                  value={sel.event}
                                  onChange={(e) => handleSelectionChange(idx, 'event', e.target.value)}
                                  placeholder={`Partido ${idx + 1}`}
                                  className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                  required
                              />
                              <input
                                  type="number"
                                  step="0.01"
                                  value={sel.odds || ''}
                                  onChange={(e) => handleSelectionChange(idx, 'odds', e.target.value)}
                                  placeholder="1.50"
                                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                  required
                              />
                          </div>
                          {selections.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => handleRemoveSelection(idx)}
                                className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-950/20 rounded-lg mt-0.5"
                              >
                                  <Trash2 size={16} />
                              </button>
                          )}
                      </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddSelection}
                    className="w-full py-2 border border-dashed border-slate-700 text-slate-400 rounded-lg text-sm hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                      <Plus size={14} /> Añadir Selección
                  </button>
              </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {betType === 'combined' ? 'Cuota Total' : 'Cuota (@)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                placeholder="1.90"
                className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors ${betType === 'combined' ? 'font-bold text-emerald-400 bg-slate-900' : ''}`}
                required
                readOnly={betType === 'combined'} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Inversión (€)</label>
              <input
                type="number"
                step="0.01"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="10.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* KELLY CRITERION CALCULATOR */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden">
              <button 
                  type="button"
                  onClick={() => setShowKelly(!showKelly)}
                  className="w-full flex items-center justify-between p-3 text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                  <span className="flex items-center gap-2 font-bold"><Calculator size={14} /> Asistente de Stake (Kelly)</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Beta</span>
              </button>
              
              {showKelly && (
                  <div className="p-3 pt-0 border-t border-slate-700/50 space-y-3 animate-fade-in">
                      <div>
                          <label className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Tu Confianza Real</span>
                              <span className="text-white font-mono">{confidence}%</span>
                          </label>
                          <input 
                              type="range" 
                              min="1" 
                              max="99" 
                              value={confidence} 
                              onChange={(e) => setConfidence(parseInt(e.target.value))}
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                      </div>
                      
                      {kellySuggestion !== null && (
                          <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-900/50 p-2 rounded-lg">
                              <div className="text-xs">
                                  <span className="text-slate-400 block">Stake Sugerido (1/4 Kelly):</span>
                                  <span className={`font-bold font-mono ${kellySuggestion > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                      {kellySuggestion > 0 ? `${kellySuggestion}€` : 'No apostar'}
                                  </span>
                              </div>
                              {kellySuggestion > 0 && (
                                  <button 
                                      type="button" 
                                      onClick={applyKelly}
                                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded shadow-sm"
                                  >
                                      Aplicar
                                  </button>
                              )}
                          </div>
                      )}
                  </div>
              )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resultado</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setResult('pending')}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                  result === 'pending' 
                    ? 'bg-slate-700 text-white border-slate-500' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Pendiente
              </button>
              <button
                type="button"
                onClick={() => setResult('won')}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                  result === 'won' 
                    ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Ganada
              </button>
              <button
                type="button"
                onClick={() => setResult('lost')}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                  result === 'lost' 
                    ? 'bg-rose-900/50 text-rose-400 border-rose-500' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Perdida
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 mt-4"
          >
            <Save size={18} />
            {betType === 'combined' ? 'Guardar Combinada' : 'Guardar Apuesta'}
          </button>
        </form>
      </div>
    </div>
  );
};