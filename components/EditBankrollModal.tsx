import React, { useState, useEffect } from 'react';
import { X, Save, Wallet } from 'lucide-react';

interface EditBankrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBankroll: number;
  onSave: (newBankroll: number) => void;
}

export const EditBankrollModal: React.FC<EditBankrollModalProps> = ({ isOpen, onClose, currentBankroll, onSave }) => {
  const [value, setValue] = useState(currentBankroll.toString());

  useEffect(() => {
    setValue(currentBankroll.toString());
  }, [currentBankroll, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      onSave(num);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Wallet size={18} className="text-rose-500" />
            Configurar Banca
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Bankroll Inicial (€)
            </label>
            <div className="relative">
                <input
                type="number"
                step="1"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-xl font-mono focus:outline-none focus:border-rose-500 transition-colors pl-10"
                autoFocus
                required
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
                Esto recalculará tu gráfico de rendimiento desde el día 1.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 mt-2"
          >
            <Save size={18} />
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
};