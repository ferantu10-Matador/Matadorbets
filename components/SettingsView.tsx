'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Database, CheckCircle2, AlertTriangle, Eye, EyeOff, Phone, ExternalLink, X, HeartHandshake, Cloud, Lock, User, RefreshCw, LogOut } from 'lucide-react';
import { Bet, UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export const SettingsView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRiskAlert, setShowRiskAlert] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Sync State
  const [syncUser, setSyncUser] = useState<string>('');
  const [syncPin, setSyncPin] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

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

    // 3. Auto-Login Check
    const storedUser = localStorage.getItem('matador_sync_user');
    const storedPin = localStorage.getItem('matador_sync_pin');
    if (storedUser && storedPin) {
        setSyncUser(storedUser);
        setSyncPin(storedPin);
        setIsLoggedIn(true);
    }

  }, []);

  const getLocalDataPayload = () => {
    return {
        bets: JSON.parse(localStorage.getItem('matador_bets_history') || '[]'),
        matches: JSON.parse(localStorage.getItem('matador_matches_cache') || '[]'),
        config: JSON.parse(localStorage.getItem('matador_bankroll_config') || '{}'),
        academy: JSON.parse(localStorage.getItem('matador_academy_progress') || '[]'),
        timestamp: new Date().toISOString()
    };
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncUser || !syncPin) return;
    if (!isSupabaseConfigured() || !supabase) {
        setSyncMessage({ type: 'error', text: 'Error: Base de datos no conectada.' });
        return;
    }

    setIsLoadingSync(true);
    setSyncMessage(null);

    try {
        // PASO A: Buscar Usuario
        const { data: existingUser, error: searchError } = await supabase
            .from('users')
            .select('*')
            .eq('username', syncUser)
            .single();

        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
             throw searchError;
        }

        if (!existingUser) {
            // PASO B: REGISTRO (Usuario no existe)
            if (window.confirm(`El usuario "${syncUser}" no existe. ¿Quieres crearlo con este PIN?`)) {
                const payload = getLocalDataPayload();
                
                const { error: createError } = await supabase
                    .from('users')
                    .insert({
                        username: syncUser,
                        secret_pin: syncPin,
                        backup_data: payload
                    });

                if (createError) throw createError;

                setSyncMessage({ type: 'success', text: '¡Cuenta creada! Tus datos locales se han subido.' });
                completeLogin();
            } else {
                setIsLoadingSync(false);
                return;
            }
        } else {
            // PASO C: LOGIN (Usuario existe)
            if (existingUser.secret_pin !== syncPin) {
                setSyncMessage({ type: 'error', text: 'PIN Incorrecto. Este usuario ya existe.' });
                setIsLoadingSync(false);
                return;
            }

            // PIN Correcto -> Restaurar datos
            if (existingUser.backup_data) {
                restoreDataToLocal(existingUser.backup_data);
                setSyncMessage({ type: 'success', text: '¡Sesión iniciada! Datos sincronizados.' });
            } else {
                setSyncMessage({ type: 'success', text: '¡Sesión iniciada! No había datos previos.' });
            }
            completeLogin();
        }

    } catch (err: any) {
        console.error("Auth error:", err);
        setSyncMessage({ type: 'error', text: 'Error de conexión: ' + err.message });
        setIsLoadingSync(false);
    }
  };

  const completeLogin = () => {
      localStorage.setItem('matador_sync_user', syncUser);
      localStorage.setItem('matador_sync_pin', syncPin);
      setIsLoggedIn(true);
      setIsLoadingSync(false);
  };

  const handleLogout = () => {
      localStorage.removeItem('matador_sync_user');
      localStorage.removeItem('matador_sync_pin');
      setSyncUser('');
      setSyncPin('');
      setIsLoggedIn(false);
      setSyncMessage(null);
  };

  const handleManualSync = async () => {
     if (!isLoggedIn || !supabase) return;
     setIsLoadingSync(true);
     try {
         const payload = getLocalDataPayload();
         const { error } = await supabase
            .from('users')
            .update({ backup_data: payload, updated_at: new Date().toISOString() })
            .eq('username', syncUser)
            .eq('secret_pin', syncPin); // Extra security check

         if (error) throw error;
         setSyncMessage({ type: 'success', text: 'Datos subidos a la nube correctamente.' });
     } catch (err: any) {
         setSyncMessage({ type: 'error', text: 'Error al subir datos: ' + err.message });
     } finally {
         setIsLoadingSync(false);
     }
  };

  const restoreDataToLocal = (data: any) => {
      if (data.bets) localStorage.setItem('matador_bets_history', JSON.stringify(data.bets));
      if (data.matches) localStorage.setItem('matador_matches_cache', JSON.stringify(data.matches));
      if (data.config) localStorage.setItem('matador_bankroll_config', JSON.stringify(data.config));
      if (data.academy) localStorage.setItem('matador_academy_progress', JSON.stringify(data.academy));
      // Reload is often needed to refresh views, but we can avoid it if we update contexts. 
      // For simplicity in this structure, we alert the user.
      // alert("Datos actualizados desde la nube."); 
      // Or auto-reload: window.location.reload();
  };

  const handleToggleZenMode = () => {
      const newValue = !isZenMode;
      setIsZenMode(newValue);
      localStorage.setItem('matador_hide_balance', String(newValue));
  };

  const handleExport = () => {
    if (typeof window === 'undefined') return;

    try {
      const backup = getLocalDataPayload();
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

        if (window.confirm("⚠️ ADVERTENCIA: Esto sobrescribirá tus datos locales. ¿Estás seguro?")) {
            restoreDataToLocal(data);
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
            Perfil y Ajustes
        </h2>
      </div>

      {/* CLOUD SYNC SECTION */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Cloud size={20} className="text-blue-500" />
                  <h3 className="font-bold text-white">Nube Matador</h3>
              </div>
              {isLoggedIn && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900">
                      ● CONECTADO
                  </span>
              )}
          </div>
          
          <div className="p-5">
              {!isSupabaseConfigured() ? (
                  <div className="text-center py-4 text-slate-500 text-sm">
                      <Database size={32} className="mx-auto mb-2 opacity-50" />
                      Base de datos no configurada. Usa el modo local.
                  </div>
              ) : !isLoggedIn ? (
                <form onSubmit={handleAuth} className="space-y-4">
                    <p className="text-sm text-slate-400 mb-2">
                        Inicia sesión para sincronizar tus apuestas entre dispositivos. Si no tienes cuenta, se creará automáticamente.
                    </p>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre de Usuario</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-3 text-slate-500" />
                            <input 
                                type="text" 
                                value={syncUser}
                                onChange={(e) => setSyncUser(e.target.value.toLowerCase().trim())}
                                placeholder="ej: matador123"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-white focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PIN de Seguridad (4-6 dígitos)</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                            <input 
                                type="password" 
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={syncPin}
                                onChange={(e) => setSyncPin(e.target.value)}
                                placeholder="****"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-white focus:border-blue-500 focus:outline-none font-mono tracking-widest"
                                required
                            />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoadingSync}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingSync ? 'Conectando...' : 'Entrar / Registrarse'}
                    </button>
                    {syncMessage && (
                        <div className={`text-xs p-3 rounded-lg border ${syncMessage.type === 'success' ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-rose-950/30 border-rose-900 text-rose-400'}`}>
                            {syncMessage.text}
                        </div>
                    )}
                </form>
              ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold border border-blue-800">
                            {syncUser.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white">{syncUser}</h4>
                            <p className="text-xs text-slate-500">Sincronización activa</p>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>

                    <button 
                        onClick={handleManualSync}
                        disabled={isLoadingSync}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg border border-slate-700 transition-all"
                    >
                        <RefreshCw size={16} className={isLoadingSync ? 'animate-spin' : ''} />
                        {isLoadingSync ? 'Subiendo...' : 'Forzar Subida a la Nube'}
                    </button>
                    
                     {syncMessage && (
                        <div className={`text-xs p-3 rounded-lg border ${syncMessage.type === 'success' ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-rose-950/30 border-rose-900 text-rose-400'}`}>
                            {syncMessage.text}
                        </div>
                    )}
                </div>
              )}
          </div>
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

      {/* LOCAL DATA SETTINGS */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
         <div className="flex items-start gap-4">
             <div className="bg-slate-800 p-3 rounded-xl text-rose-500">
                <Database size={24} />
             </div>
             <div>
                <h3 className="font-bold text-white text-lg">Copia Local</h3>
                <p className="text-sm text-slate-400 mt-1">
                   Gestiona tu archivo de seguridad manual.
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
            Matadorbets PWA v2.3
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