'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Database, CheckCircle2, AlertTriangle, Eye, EyeOff, Phone, ExternalLink, X, HeartHandshake } from 'lucide-react';
import { Bet } from '../types';

export const SettingsView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRiskAlert, setShowRiskAlert] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Risk Detection Logic
    const savedBets = localStorage.getItem('matador_bets_history');
    if (savedBets) {
        try {
            const bets: Bet[] = JSON.parse(savedBets);
            const settledBets = bets.filter(b => b.result !== 'pending');
            
            if (settledBets.length > 5) {
                let netProfit = 0;
                let totalInvested = 0;
                
                settledBets.forEach(bet => {
                    if (bet.result === 'won') {
                        netProfit += (bet.stake * bet.odds) - bet.stake;
                    } else if (bet.result === 'lost') {
                        netProfit -= bet.stake;
                    }
                    totalInvested += bet.stake;
                });

                const yieldVal = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
                
                // Trigger alert if Yield < -25%
                if (yieldVal < -25) {
                    setShowRiskAlert(true);
                }
            }
        } catch (e) {
            console.error("Error calculating risk", e);
        }
    }

    // 2. Load Zen Mode
    const zenSetting = localStorage.getItem('matador_hide_balance');
    setIsZenMode(zenSetting === 'true');

  }, []);

  const handleToggleZenMode = () => {
      const newValue = !isZenMode;
      setIsZenMode(newValue);
      localStorage.setItem('matador_hide_balance', String(newValue));
  };

  const handleExport = () => {
    if (typeof window === 'undefined') return;

    try {
      const backup = {
        version: 1,
        timestamp: new Date().toISOString(),
        bets: JSON.parse(localStorage.getItem('matador_bets_history') || '[]'),
        matches: JSON.parse(localStorage.getItem('matador_matches_cache') || '[]'),
        config: JSON.parse(localStorage.getItem('matador_bankroll_config') || '{}')
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `matador_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error creando la copia de seguridad.");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof window === 'undefined') return;
      
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        
        const data = JSON.parse(result);

        if (window.confirm("⚠️ ADVERTENCIA: Esto sobrescribirá tus datos actuales (apuestas, bankroll, análisis). ¿Estás seguro?")) {
            if (data.bets) localStorage.setItem('matador_bets_history', JSON.stringify(data.bets));
            if (data.matches) localStorage.setItem('matador_matches_cache', JSON.stringify(data.matches));
            if (data.config) localStorage.setItem('matador_bankroll_config', JSON.stringify(data.config));
            
            alert('¡Datos restaurados con éxito! Recarga la página.');
            window.location.reload();
        }
      } catch (error) {
        console.error("Error importing data:", error);
        alert('Error al leer el archivo. Asegúrate de que es un backup válido.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-slate-500 rounded-full shadow-[0_0_10px_rgba(100,116,139,0.5)]"></span>
            Ajustes y Seguridad
        </h2>
      </div>

      {/* RISK ALERT */}
      {showRiskAlert && (
          <div className="bg-red-950/30 border border-red-500/50 rounded-xl p-4 flex gap-4 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <div className="bg-red-900/50 p-2 h-fit rounded-lg text-red-400">
                  <AlertTriangle size={24} />
              </div>
              <div>
                  <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider mb-1">Racha Negativa Detectada</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                      El Matador ha detectado pérdidas significativas recientes. 
                      <strong className="text-white"> Considera tomarte un descanso.</strong> No intentes recuperar pérdidas impulsivamente.
                  </p>
              </div>
          </div>
      )}

      {/* RESPONSIBLE GAMBLING SETTINGS */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
         <div className="flex items-start gap-4">
             <div className="bg-slate-800 p-3 rounded-xl text-blue-400">
                <HeartHandshake size={24} />
             </div>
             <div>
                <h3 className="font-bold text-white text-lg">Bienestar Digital</h3>
                <p className="text-sm text-slate-400 mt-1">
                   Herramientas para mantener una relación saludable con el juego.
                </p>
             </div>
         </div>
         
         <hr className="border-slate-800" />

         {/* Zen Mode Toggle */}
         <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
             <div className="flex gap-3">
                 <div className={`p-2 rounded-lg ${isZenMode ? 'bg-purple-900/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                     {isZenMode ? <EyeOff size={20} /> : <Eye size={20} />}
                 </div>
                 <div>
                     <h4 className="text-white font-bold text-sm">Modo Zen (Ocultar Cifras)</h4>
                     <p className="text-xs text-slate-500 max-w-[200px] xs:max-w-none">
                        {isZenMode ? 'Tu bankroll está oculto para reducir ansiedad.' : 'Muestra el dinero ganado/perdido.'}
                     </p>
                 </div>
             </div>
             
             <button 
                onClick={handleToggleZenMode}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${isZenMode ? 'bg-purple-600' : 'bg-slate-700'}`}
             >
                 <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isZenMode ? 'translate-x-6' : 'translate-x-0'}`} />
             </button>
         </div>
      </div>

      {/* DATA SETTINGS */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
         <div className="flex items-start gap-4">
             <div className="bg-slate-800 p-3 rounded-xl text-rose-500">
                <Database size={24} />
             </div>
             <div>
                <h3 className="font-bold text-white text-lg">Control de Datos</h3>
                <p className="text-sm text-slate-400 mt-1">
                   Gestiona tu copia de seguridad local.
                </p>
             </div>
         </div>

         <hr className="border-slate-800" />

         <div className="grid sm:grid-cols-2 gap-4">
            {/* Export */}
            <button 
               onClick={handleExport}
               className="bg-emerald-950/20 hover:bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 text-left group transition-all"
            >
                <div className="flex justify-between items-start mb-2">
                    <Download size={20} className="text-emerald-500" />
                </div>
                <h4 className="font-bold text-emerald-400 text-sm">Exportar Backup</h4>
                <p className="text-xs text-slate-500 mt-1">Descargar .JSON</p>
            </button>

            {/* Import */}
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="bg-blue-950/20 hover:bg-blue-950/30 border border-blue-900/50 rounded-xl p-4 text-left group transition-all"
            >
                <div className="flex justify-between items-start mb-2">
                    <Upload size={20} className="text-blue-500" />
                </div>
                <h4 className="font-bold text-blue-400 text-sm">Restaurar Datos</h4>
                <p className="text-xs text-slate-500 mt-1">Subir .JSON</p>
                <input 
                   type="file" 
                   accept=".json" 
                   className="hidden" 
                   ref={fileInputRef}
                   onChange={handleImport}
                />
            </button>
         </div>
      </div>

      {/* HELP BUTTON */}
      <div className="pt-4">
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="w-full border-2 border-rose-600/50 text-rose-500 hover:bg-rose-950/30 hover:border-rose-500 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
             <Phone size={18} />
             🆘 Necesito Ayuda Profesional
          </button>
      </div>

      {/* PWA Info */}
      <div className="text-center">
         <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1.5">
            <CheckCircle2 size={10} className="text-emerald-500" />
            Matadorbets Local PWA v2.2
         </p>
      </div>

      {/* PROFESSIONAL HELP MODAL */}
      {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
              <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          Ayuda Externa
                      </h3>
                      <button onClick={() => setIsHelpModalOpen(false)} className="text-slate-500 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <p className="text-slate-300 text-sm leading-relaxed">
                          Reconocer que necesitas ayuda es el paso más valiente. Aquí tienes recursos confidenciales y gratuitos.
                      </p>

                      <a href="https://jugadoresanonimos.org/" target="_blank" rel="noopener noreferrer" className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 transition-colors group">
                          <h4 className="font-bold text-white flex items-center gap-2">
                              Jugadores Anónimos
                              <ExternalLink size={14} className="opacity-50 group-hover:opacity-100" />
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">Reuniones y soporte en España.</p>
                      </a>

                      <a href="https://www.gamblingtherapy.org/es/" target="_blank" rel="noopener noreferrer" className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 transition-colors group">
                          <h4 className="font-bold text-white flex items-center gap-2">
                              Gambling Therapy
                              <ExternalLink size={14} className="opacity-50 group-hover:opacity-100" />
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">Ayuda internacional online.</p>
                      </a>

                      <button 
                        onClick={() => {
                            window.location.href = 'https://google.com';
                        }}
                        className="w-full bg-rose-700 hover:bg-rose-600 text-white font-bold py-3 rounded-xl mt-4"
                      >
                          Salir de la App por hoy
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};