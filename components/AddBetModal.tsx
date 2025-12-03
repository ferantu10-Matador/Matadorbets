import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Link, Layers } from 'lucide-react';
import { Bet, BetSelection } from '../types';

interface AddBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bet: Omit<Bet, 'id' | 'date'>) => void;
}

export const AddBetModal: React.FC<AddBetModalProps> = ({ isOpen, onClose, onSave }) => {
  const [betType, setBetType] = useState<'simple' | 'combined'>('simple');
  const [event, setEvent] = useState('');
  const [sport, setSport] = useState('football');
  const [stake, setStake] = useState('');
  const [odds, setOdds] = useState('');
  const [result, setResult] = useState<'pending' | 'won' | 'lost'>('pending');
  
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
        // Only update if total is greater than 1 and we have valid selections
        if (total > 1 && selections.some(s => s.odds > 0)) {
            setOdds(total.toFixed(2));
        } else {
            setOdds('');
        }
    }
  }, [selections, betType]);

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

    // Construct the Bet object
    const finalEventName = betType === 'simple' 
        ? event 
        : `Combinada (${selections.length} sel.)`;

    const finalSelections: BetSelection[] | undefined = betType === 'combined' 
        ? selections.map((s, i) => ({ id: `sel-${Date.now()}-${i}`, event: s.event, odds: s.odds }))
        : undefined;

    onSave({
      event: finalEventName,
      type: betType,
      selections: finalSelections,
      sport,
      stake: parseFloat(stake),
      odds: parseFloat(odds),
      result
    });
    
    // Reset form
    setEvent('');
    setStake('');
    setOdds('');
    setSport('football');
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
                        ? 'text-rose-500 border-b-2 border-rose-500 bg-slate-800/50' 
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
          
          {/* Sport Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deporte</label>
            <select
               value={sport}
               onChange={(e) => setSport(e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors appearance-none"
            >
                <option value="football">⚽ Fútbol</option>
                <option value="basketball">🏀 Baloncesto</option>
                <option value="tennis">🎾 Tenis</option>
                <option value="esports">🎮 eSports</option>
                <option value="other">🎲 Otro</option>
            </select>
          </div>

          {/* EVENTS INPUT */}
          {betType === 'simple' ? (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Evento / Partido</label>
                <input
                  type="text"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  placeholder="Ej: Real Madrid vs City"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
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
                                  className="col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                                  required
                              />
                              <input
                                  type="number"
                                  step="0.01"
                                  value={sel.odds || ''}
                                  onChange={(e) => handleSelectionChange(idx, 'odds', e.target.value)}
                                  placeholder="1.50"
                                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
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
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Inversión (€)</label>
              <input
                type="number"
                step="0.01"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="10.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
                required
              />
            </div>
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
                className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors ${betType === 'combined' ? 'font-bold text-emerald-400 bg-slate-900' : ''}`}
                required
                readOnly={betType === 'combined'} 
              />
            </div>
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
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 mt-4"
          >
            <Save size={18} />
            {betType === 'combined' ? 'Guardar Combinada' : 'Guardar Apuesta'}
          </button>
        </form>
      </div>
    </div>
  );
};