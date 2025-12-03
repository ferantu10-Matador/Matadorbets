'use client';

import React, { useRef } from 'react';
import { Download, Upload, Database, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (typeof window === 'undefined') return;

    try {
      // Recopilar todos los datos parseados
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
            // Guardar en localStorage (convertir de vuelta a string)
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
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-slate-500 rounded-full shadow-[0_0_10px_rgba(100,116,139,0.5)]"></span>
            Ajustes y Datos
        </h2>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
         <div className="flex items-start gap-4">
             <div className="bg-slate-800 p-3 rounded-xl text-rose-500">
                <Database size={24} />
             </div>
             <div>
                <h3 className="font-bold text-white text-lg">Control de Datos</h3>
                <p className="text-sm text-slate-400 mt-1">
                   Tus datos se guardan exclusivamente en este dispositivo. Usa estas opciones para moverlos a otro móvil o guardarlos a salvo.
                </p>
             </div>
         </div>

         <hr className="border-slate-800" />

         {/* Export Card */}
         <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-5 relative overflow-hidden group hover:bg-emerald-950/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Download size={64} />
            </div>
            
            <h4 className="font-bold text-emerald-400 flex items-center gap-2 mb-2">
               <Download size={18} /> Exportar Copia
            </h4>
            <p className="text-xs text-slate-400 mb-4 max-w-[80%]">
               Descarga un archivo seguro con todo tu historial de apuestas, configuración de bankroll y partidos analizados.
            </p>
            
            <button 
               onClick={handleExport}
               className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2"
            >
               Descargar .JSON
            </button>
         </div>

         {/* Import Card */}
         <div className="bg-blue-950/20 border border-blue-900/50 rounded-xl p-5 relative overflow-hidden group hover:bg-blue-950/30 transition-colors">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Upload size={64} />
            </div>

            <h4 className="font-bold text-blue-400 flex items-center gap-2 mb-2">
               <Upload size={18} /> Restaurar Datos
            </h4>
            <p className="text-xs text-slate-400 mb-4 max-w-[80%]">
               Sube un archivo de copia de seguridad (.json) para recuperar tus datos en este dispositivo.
            </p>
            
            <input 
               type="file" 
               accept=".json" 
               className="hidden" 
               ref={fileInputRef}
               onChange={handleImport}
            />
            
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
            >
               Subir Archivo
            </button>
         </div>
      </div>

      {/* PWA Info */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
         <h4 className="font-bold text-white flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-slate-500" /> Estado de la App
         </h4>
         <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Modo Local Activo
         </div>
         <p className="text-[10px] text-slate-500 mt-2 text-center">
            Matadorbets v2.1 (PWA Build)
         </p>
      </div>
    </div>
  );
};