import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { X, Search, Calendar, ChevronRight, Trophy, Trash2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => 
    item.matchTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(item.timestamp).toLocaleDateString().includes(searchTerm)
  ).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex overflow-hidden flex-col md:flex-row shadow-rose-900/10">
        
        {/* Sidebar List */}
        <div className={`flex flex-col w-full md:w-1/3 border-r border-slate-700 bg-slate-950/50 ${selectedItem ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-rose-500" />
              Historial
            </h2>
            <div className="flex gap-2">
                {history.length > 0 && (
                    <button onClick={onClearHistory} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Borrar historial">
                        <Trash2 size={16} />
                    </button>
                )}
                <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>
          </div>

          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Buscar equipo o fecha..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center text-slate-600 py-10 text-sm">
                No hay análisis guardados.
              </div>
            ) : (
              filteredHistory.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    selectedItem?.id === item.id 
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-sm' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <ChevronRight size={14} className={`text-slate-500 ${selectedItem?.id === item.id ? 'text-rose-400' : ''}`} />
                  </div>
                  <h3 className="font-bold text-slate-200 text-sm truncate mb-1">{item.matchTitle}</h3>
                  <p className="text-xs text-rose-400 truncate">{item.summary}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className={`flex-1 flex flex-col bg-slate-900 ${!selectedItem ? 'hidden md:flex' : 'flex'}`}>
          {selectedItem ? (
            <>
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/30">
                <button 
                  onClick={() => setSelectedItem(null)} 
                  className="md:hidden flex items-center gap-1 text-sm text-slate-400 hover:text-white"
                >
                  ← Volver
                </button>
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-rose-500" />
                    <span className="font-semibold text-slate-200">Detalle del Análisis</span>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                 {/* Reusing MessageBubble logic but treating it as a static view */}
                 <div className="max-w-3xl mx-auto">
                    <MessageBubble message={{
                        id: selectedItem.id,
                        role: 'model',
                        text: selectedItem.fullContent,
                        timestamp: new Date(selectedItem.timestamp),
                        groundingChunks: selectedItem.groundingChunks
                    }} />
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
              <Trophy size={48} className="mb-4 opacity-10" />
              <p className="text-lg font-medium">Selecciona un partido del historial</p>
              <p className="text-sm opacity-50">Los datos de la arena nunca se olvidan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};