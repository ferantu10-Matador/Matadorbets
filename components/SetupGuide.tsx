import React from 'react';
import { Key, ExternalLink } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-rose-900/50 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full animate-fade-in my-2">
      <div className="bg-rose-900/20 p-4 border-b border-rose-900/30 flex items-center gap-3">
        <div className="bg-rose-600 p-2 rounded-lg text-white shadow-lg shadow-rose-900/50">
          <Key size={20} />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Configuración Necesaria</h3>
          <p className="text-rose-200 text-xs font-medium">Falta la API Key de Google</p>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <p className="text-slate-300 text-sm leading-relaxed">
          Para que Matadorbets funcione, necesitas una clave gratuita de Google.
        </p>

        <ol className="space-y-3">
          <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <span className="bg-slate-700 text-slate-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 border border-slate-600">1</span>
            <div className="text-sm">
              <span className="text-slate-200 font-semibold block mb-1">Consigue tu Clave</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 underline font-medium transition-colors"
              >
                Ir a Google AI Studio <ExternalLink size={12} />
              </a>
            </div>
          </li>

          <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <span className="bg-slate-700 text-slate-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 border border-slate-600">2</span>
            <div className="text-sm text-slate-400">
              <span className="text-slate-200 font-semibold block mb-1">Añádela en Vercel</span>
              Ve a <span className="text-slate-200 font-semibold">Settings</span> luego a <span className="text-slate-200 font-semibold">Environment Variables</span>.
            </div>
          </li>

          <li className="flex gap-3 items-start bg-slate-800/50 p-3 rounded-lg border border-slate-700">
             <span className="bg-slate-700 text-slate-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 border border-slate-600">3</span>
             <div className="text-sm text-slate-400">
                <span className="text-slate-200 font-semibold block mb-1">Configura la Variable</span>
                Key: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-rose-400 font-mono text-xs border border-slate-700">API_KEY</code>
                <br />
                Value: <span className="text-slate-500 italic">(Tu código de Google)</span>
             </div>
          </li>
        </ol>

        <div className="bg-blue-900/20 border border-blue-800/50 p-3 rounded-lg">
           <p className="text-blue-200 text-xs text-center">
             Después de guardar, ve a <strong>Deployments</strong> y pulsa <strong>Redeploy</strong>.
           </p>
        </div>
      </div>
    </div>
  );
};
