import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Bet } from '../types';

interface AddBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bet: Omit<Bet, 'id' | 'date'>) => void;
}

export const AddBetModal: React.FC<AddBetModalProps> = ({ isOpen, onClose, onSave }) => {
  const [event, setEvent] = useState('');
  const [sport, setSport] = useState('football');
  const [stake, setStake] = useState('');
  const [odds, setOdds] = useState('');
  const [result, setResult] = useState<'pending' | 'won' | 'lost'>('pending');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !stake || !odds) return;

    onSave({
      event,
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
          <h3 className="font-bold text-white text-lg">Registrar Apuesta</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
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

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cuota (@)</label>
              <input
                type="number"
                step="0.01"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                placeholder="1.90"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
                required
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
            Guardar Apuesta
          </button>
        </form>
      </div>
    </div>
  );
};