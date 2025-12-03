import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, CheckCircle2, X, Lightbulb, GraduationCap, ChevronRight, Lock } from 'lucide-react';
import { Lesson } from '../types';

const LESSONS: Lesson[] = [
  // NIVEL 1: FUNDAMENTOS
  {
    id: 1,
    level: 'Novato 👶',
    title: '¿Qué es el Bankroll?',
    concept: 'Es el dinero TOTAL que tienes destinado EXCLUSIVAMENTE a las apuestas. No es el dinero del alquiler ni de la comida. Es tu capital de inversión.',
    example: 'Si tienes 100€ para apostar este mes, tu Bankroll es 100€. Nunca debes apostar más de lo que hay en esta caja.',
    tip: 'Nunca apuestes más del 5% de tu bankroll en una sola jugada, por muy segura que parezca.'
  },
  {
    id: 2,
    level: 'Novato 👶',
    title: 'Stake: La confianza',
    concept: 'Es la cantidad de dinero que apuestas en una jugada, medida en "unidades" o porcentaje de tu bank. Stake 1 es poca confianza, Stake 10 es máxima.',
    example: 'Stake 1 = 1% de tu banco (1€). Stake 10 = 10% de tu banco (10€).',
    tip: 'El 90% de tus apuestas deberían ser Stake 1 o 2. Los "Stakes 10" casi no existen en la vida real.'
  },
  // NIVEL 2: TÉCNICA
  {
    id: 3,
    level: 'Avanzado 🧐',
    title: 'El Valor (Value Betting)',
    concept: 'Apostar no se trata de acertar quién gana, sino de encontrar errores en las cuotas de la casa. Si la probabilidad real es mayor que la que paga la cuota, hay valor.',
    example: 'Si el Madrid tiene un 50% de ganar (Cuota justa 2.00) pero la casa paga a 2.50, es una apuesta de valor OBLIGATORIA, aunque pierdas.',
    tip: 'A largo plazo, solo ganarás dinero si apuestas por valor, no por corazonadas.'
  },
  {
    id: 4,
    level: 'Avanzado 🧐',
    title: 'Hándicap Asiático',
    concept: 'Una ventaja o desventaja virtual que se le da a un equipo para equilibrar la cuota. Elimina la opción del empate en muchos casos.',
    example: 'Apostar "Real Madrid -1.0": Para ganar, el Madrid debe ganar por 2 goles o más. Si gana por solo 1, te devuelven el dinero.',
    tip: 'Es la herramienta favorita de los profesionales para protegerse de empates tontos.'
  },
  // NIVEL 3: MATADOR
  {
    id: 5,
    level: 'Matador 🐂',
    title: 'Yield vs ROI',
    concept: 'El ROI mide el retorno total, pero el Yield mide tu habilidad real como apostador sobre el volumen movido.',
    example: 'Ganar 1000€ apostando 100€ (Yield altísimo) es mejor que ganar 1000€ apostando 10.000€ (Yield bajo).',
    tip: 'Un Yield superior al 5% tras 500 apuestas es señal de que eres un ganador sólido.'
  },
   {
    id: 6,
    level: 'Matador 🐂',
    title: 'Varianza y Mala Racha',
    concept: 'La suerte a corto plazo. Incluso el mejor analista puede perder 10 apuestas seguidas. Eso es varianza estadística.',
    example: 'Lanzar una moneda 10 veces y que salga 8 veces cruz. A largo plazo (1000 veces) se equilibrará.',
    tip: 'Si entiendes la varianza, no entrarás en pánico (tilt) cuando pierdas 3 días seguidos.'
  }
];

const STORAGE_KEY = 'matador_academy_progress';

export const AcademyView: React.FC = () => {
  const [readLessons, setReadLessons] = useState<number[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress safely
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setReadLessons(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading academy progress", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const handleLessonOpen = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  const handleLessonClose = () => {
    if (selectedLesson && !readLessons.includes(selectedLesson.id)) {
      const newRead = [...readLessons, selectedLesson.id];
      setReadLessons(newRead);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRead));
    }
    setSelectedLesson(null);
  };

  const progressPercentage = Math.round((readLessons.length / LESSONS.length) * 100);

  // Group lessons by level
  const groupedLessons = useMemo<Record<string, Lesson[]>>(() => {
    const groups: Record<string, Lesson[]> = {};
    LESSONS.forEach(lesson => {
      if (!groups[lesson.level]) {
        groups[lesson.level] = [];
      }
      groups[lesson.level].push(lesson);
    });
    return groups;
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="p-4 pb-24 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            Academia Matador
        </h2>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
           {readLessons.length} / {LESSONS.length} Lecciones
        </span>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
          <span>Progreso General</span>
          <span className={progressPercentage === 100 ? 'text-emerald-400' : 'text-blue-400'}>{progressPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
                progressPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Lesson List */}
      <div className="space-y-6">
        {(Object.entries(groupedLessons) as [string, Lesson[]][]).map(([level, lessons]) => {
           const isMatadorLevel = level.includes('Matador');
           return (
             <div key={level}>
               <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${
                   isMatadorLevel ? 'text-amber-500' : 'text-slate-500'
               }`}>
                  {isMatadorLevel ? <CheckCircle2 size={14} className="text-amber-500"/> : <BookOpen size={14} />}
                  {level}
               </h3>
               
               <div className="grid gap-3 sm:grid-cols-2">
                 {lessons.map(lesson => {
                   const isRead = readLessons.includes(lesson.id);
                   const isEpic = lesson.level.includes('Matador');

                   return (
                     <button
                       key={lesson.id}
                       onClick={() => handleLessonOpen(lesson)}
                       className={`group relative text-left p-4 rounded-xl border transition-all duration-300 shadow-lg hover:-translate-y-1 ${
                         isEpic 
                           ? 'bg-slate-900 border-amber-500/30 hover:border-amber-500 hover:shadow-amber-900/20' 
                           : 'bg-slate-900 border-slate-800 hover:border-blue-500/50 hover:shadow-blue-900/20'
                       }`}
                     >
                       {/* Epic Glow */}
                       {isEpic && <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 blur-xl rounded-full -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-colors"></div>}

                       <div className="flex justify-between items-start mb-2 relative z-10">
                          <div className={`p-2 rounded-lg ${
                              isRead 
                                ? 'bg-emerald-950/30 text-emerald-500' 
                                : isEpic ? 'bg-amber-950/30 text-amber-500' : 'bg-slate-800 text-slate-400'
                          }`}>
                              {isRead ? <CheckCircle2 size={20} /> : <GraduationCap size={20} />}
                          </div>
                          {isRead && (
                             <span className="text-[10px] font-bold text-emerald-500 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900">LEÍDA</span>
                          )}
                       </div>
                       
                       <h4 className={`font-bold text-lg mb-1 relative z-10 ${isEpic ? 'text-amber-100' : 'text-slate-200'}`}>
                         {lesson.title}
                       </h4>
                       <p className="text-xs text-slate-500 line-clamp-2 relative z-10">
                         {lesson.concept}
                       </p>
                       
                       <div className="mt-4 flex items-center text-xs font-bold text-slate-600 group-hover:text-white transition-colors">
                          Ver Lección <ChevronRight size={14} className="ml-1" />
                       </div>
                     </button>
                   );
                 })}
               </div>
             </div>
           );
        })}
      </div>

      {/* Lesson Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
             
             {/* Header */}
             <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-start">
               <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border mb-2 inline-block ${
                      selectedLesson.level.includes('Matador') 
                        ? 'bg-amber-950/30 text-amber-500 border-amber-900/50' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                      {selectedLesson.level}
                  </span>
                  <h2 className="text-2xl font-bold text-white leading-tight">
                      {selectedLesson.title}
                  </h2>
               </div>
               <button 
                 onClick={handleLessonClose}
                 className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
               >
                 <X size={20} />
               </button>
             </div>

             {/* Scrollable Content */}
             <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Concept */}
                <div className="space-y-2">
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Concepto Clave</h3>
                   <p className="text-slate-300 text-lg leading-relaxed">
                      {selectedLesson.concept}
                   </p>
                </div>

                {/* Example Box */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 relative">
                   <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-xl"></div>
                   <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-2">Ejemplo Práctico</h3>
                   <p className="text-slate-400 text-sm font-mono leading-relaxed italic">
                      "{selectedLesson.example}"
                   </p>
                </div>

                {/* Matador Tip */}
                <div className="bg-gradient-to-r from-amber-950/30 to-transparent border border-amber-500/20 rounded-xl p-5 shadow-inner">
                   <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wide flex items-center gap-2 mb-3">
                      <Lightbulb size={16} /> Consejo del Matador
                   </h3>
                   <p className="text-amber-100/90 text-sm font-medium leading-relaxed">
                      {selectedLesson.tip}
                   </p>
                </div>

             </div>

             {/* Footer Button */}
             <div className="p-4 border-t border-slate-800 bg-slate-950">
                <button
                  onClick={handleLessonClose}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <CheckCircle2 size={20} />
                  Marcar como Leída
                </button>
             </div>

          </div>
        </div>
      )}
    </div>
  );
};