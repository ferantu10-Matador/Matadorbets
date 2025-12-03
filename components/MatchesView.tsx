import React, { useEffect, useState } from 'react';
import { Match } from '../types';
import { fetchTopMatches, analyzeMatch } from '../services/geminiService';
import { Loader2, TrendingUp, Clock, Trophy, ArrowRight, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { MatchDetailModal } from './MatchDetailModal';

// Note: onAnalyzeMatch prop is removed as we handle it internally now
interface MatchesViewProps {
    // Empty props as logic is internal now
}

const CACHE_KEY = 'matador_matches_cache_v3'; // Incremented cache version

export const MatchesView: React.FC<MatchesViewProps> = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [analyzingIndex, setAnalyzingIndex] = useState<number | null>(null);
  const [error, setError] = useState(false);
  
  // Modal State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadMatches = async (forceRefresh: boolean = false) => {
    setIsLoadingList(true);
    setError(false);

    // Force strict date check: Only show matches for "today" in local time
    const checkDate = new Date();
    const localTodayStr = checkDate.toLocaleDateString();

    // 1. Try to load from Cache first (if not forcing refresh)
    if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                // Check if the cache is from today and has data
                if (parsed.date === localTodayStr && parsed.matches && parsed.matches.length > 0) {
                    setMatches(parsed.matches);
                    setIsLoadingList(false);
                    return; // Exit early, use cache
                }
            } catch (e) {
                console.warn("Cache inválida, recargando...", e);
            }
        }
    }

    // 2. Fetch from AI if no cache or forced refresh
    try {
      const rawData = await fetchTopMatches();
      
      // Strict Client-Side Filter: Only allow matches that fall on "Today" in user's local time
      const todayMatches = rawData.filter(m => {
          if (!m.utc_timestamp) return true; // Keep if no time provided (fallback)
          const matchDate = new Date(m.utc_timestamp);
          return matchDate.toLocaleDateString() === localTodayStr;
      });

      if (todayMatches && todayMatches.length > 0) {
          setMatches(todayMatches);
          
          // 3. Save to Cache
          localStorage.setItem(CACHE_KEY, JSON.stringify({
              date: localTodayStr,
              matches: todayMatches
          }));
      } else {
          // If 0 matches found for today (or API fail), keep state empty but don't error hard if it was just a filter issue
           if (rawData.length > 0) {
              // API returned matches but none for today? Maybe show them anyway or show empty
              // For now, let's show what we got but warn console
              console.log("No matches matched strict filter, showing raw results as fallback");
              setMatches(rawData);
              localStorage.setItem(CACHE_KEY, JSON.stringify({
                  date: localTodayStr,
                  matches: rawData
              }));
           } else {
              setError(true);
           }
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadMatches(false); // Initial load, try cache
  }, []);

  const handleRefresh = () => {
      if(window.confirm("¿Recargar la cartelera? Se perderán los análisis guardados de hoy.")) {
          loadMatches(true); // Force API call
      }
  };

  const handleAnalyzeClick = async (index: number) => {
      const match = matches[index];

      // CASE A: Analysis already exists in Local State
      if (match.analysis) {
          setSelectedMatch(match);
          setIsModalOpen(true);
          return;
      }

      // CASE B: Fetch Analysis (Smart Fetch via Supabase/Gemini)
      setAnalyzingIndex(index);
      try {
          // Use the new analyzeMatch function which handles the Supabase caching
          const response = await analyzeMatch(match.home, match.away, match.league, match.utc_timestamp);

          // Update the specific match with the analysis
          const updatedMatches = [...matches];
          updatedMatches[index] = {
              ...match,
              analysis: response.text,
              groundingChunks: response.groundingChunks
          };

          setMatches(updatedMatches);
          
          // Persist to LocalStorage (so we don't even need to hit Supabase again for this session)
          const todayStr = new Date().toLocaleDateString();
          localStorage.setItem(CACHE_KEY, JSON.stringify({
              date: todayStr,
              matches: updatedMatches
          }));

          // Open Modal
          setSelectedMatch(updatedMatches[index]);
          setIsModalOpen(true);

      } catch (err) {
          console.error("Error analyzing match:", err);
          alert("Error conectando con el Matador. Inténtalo de nuevo.");
      } finally {
          setAnalyzingIndex(null);
      }
  };

  // Helper to format time to user's local time
  const formatLocalTime = (utcString?: string, fallbackTime?: string) => {
    if (!utcString) return fallbackTime || '--:--';
    try {
        const date = new Date(utcString);
        return date.toLocaleTimeString(undefined, { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    } catch (e) {
        return fallbackTime || '--:--';
    }
  };

  if (isLoadingList) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="relative">
             <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
             <Loader2 size={48} className="text-emerald-400 animate-spin relative z-10" />
        </div>
        <h3 className="mt-6 text-xl font-bold text-white">Escaneando Ligas...</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-xs">El Matador está buscando los partidos con mayor valor del día.</p>
      </div>
    );
  }

  if (error || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Trophy size={48} className="text-slate-700 mb-4" />
        <h3 className="text-lg font-bold text-slate-300">Sin datos de cartelera</h3>
        <p className="text-slate-500 text-sm mt-2 mb-6">No pudimos conectar con la base de datos de partidos.</p>
        <button 
            onClick={() => loadMatches(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700 hover:border-emerald-500"
        >
            <RefreshCw size={16} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                Partidos de Hoy
            </h2>
            <span className="hidden xs:inline-block text-xs font-mono text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50">
                {new Date().toLocaleDateString()}
            </span>
        </div>

        <button 
            onClick={handleRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 rounded-lg border border-slate-700 transition-colors shadow-sm active:scale-95"
            title="Actualizar cartelera"
        >
            <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((match, index) => {
          const isAnalyzing = analyzingIndex === index;
          const hasAnalysis = !!match.analysis;

          return (
            <div 
                key={index}
                className={`group bg-slate-900/80 border rounded-xl p-4 shadow-lg transition-all relative overflow-hidden ${
                    hasAnalysis ? 'border-emerald-500/30 hover:border-emerald-500/60' : 'border-slate-800 hover:border-slate-600'
                }`}
            >
                {/* Background Gradient Effect */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 transition-colors ${
                    hasAnalysis ? 'bg-emerald-500/10' : 'bg-slate-700/5 group-hover:bg-slate-700/10'
                }`}></div>

                {/* League & Time */}
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[60%]">
                        {match.league}
                    </span>
                    <div className="flex items-center gap-1 text-slate-300 text-xs font-mono bg-slate-800/50 px-2 py-1 rounded shrink-0">
                        <Clock size={12} />
                        {/* Safe Local Time Formatting */}
                        {formatLocalTime(match.utc_timestamp, match.time)}
                    </div>
                </div>

                {/* Teams */}
                <div className="flex justify-between items-center mb-4 gap-2">
                    <div className="flex-1 text-left min-w-0">
                        <h3 className="font-bold text-white text-lg leading-tight truncate" title={match.home}>{match.home}</h3>
                    </div>
                    <div className="px-1 text-slate-600 font-bold text-xs shrink-0">VS</div>
                    <div className="flex-1 text-right min-w-0">
                        <h3 className="font-bold text-white text-lg leading-tight truncate" title={match.away}>{match.away}</h3>
                    </div>
                </div>

                {/* Fact & Action */}
                <div className="flex items-end justify-between gap-3 mt-2 border-t border-slate-800/50 pt-3">
                    <p className="text-[11px] text-slate-400 leading-snug flex-1 italic line-clamp-2">
                        <TrendingUp size={12} className="inline mr-1 text-emerald-500" />
                        {match.fact}
                    </p>
                    
                    <button
                        onClick={() => handleAnalyzeClick(index)}
                        disabled={isAnalyzing}
                        className={`flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-lg shadow-lg active:scale-95 transition-all shrink-0 ${
                            isAnalyzing 
                                ? 'bg-slate-800 text-slate-400 cursor-wait'
                                : hasAnalysis
                                    ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-900 hover:text-emerald-300'
                                    : 'bg-slate-800 hover:bg-emerald-600 text-white shadow-emerald-900/10 hover:shadow-emerald-500/20'
                        }`}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Analizando...
                            </>
                        ) : hasAnalysis ? (
                            <>
                                <FileText size={14} />
                                Ver Análisis
                            </>
                        ) : (
                            <>
                                Analizar
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </div>

                {/* Success Indicator for stored analysis */}
                {hasAnalysis && !isAnalyzing && (
                    <div className="absolute top-2 right-2 text-emerald-500 animate-fade-in">
                        <CheckCircle2 size={14} />
                    </div>
                )}
            </div>
          );
        })}
      </div>
      
      <p className="text-center text-[10px] text-slate-600 mt-6 pb-4">
        Datos obtenidos por IA. Horarios convertidos a tu zona local.
      </p>

      {/* Detail Modal */}
      <MatchDetailModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         match={selectedMatch}
      />
    </div>
  );
};