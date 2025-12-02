import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatState, HistoryItem } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { HistoryModal } from './components/HistoryModal';
import { INITIAL_MESSAGE } from './constants';
import { MatadorLogo } from './components/MatadorLogo';
import { TrendingUp, AlertTriangle, History, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [
      {
        id: 'init-1',
        role: 'model',
        text: INITIAL_MESSAGE,
        timestamp: new Date(),
      }
    ],
    isLoading: false,
  });

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('tipster_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('tipster_history', JSON.stringify(history));
  }, [history]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  // Helper to extract useful metadata from the raw text for the history summary
  const extractMatchDetails = (text: string): { title: string; summary: string } => {
    const titleMatch = text.match(/INFORME MATADOR:\s*(.*?)(\n|$)/i) || text.match(/⚽\s*(.*?)(\n|$)/);
    let title = titleMatch ? titleMatch[1].trim() : "Análisis Matador";
    title = title.replace(/\*\*/g, '');

    const valueMatch = text.match(/⚖️\s*\*\*?VALOR\*\*?.*?:?\s*\n?\s*\*\s*\*\*Selección:\*\*\s*(.*?)(?:\n|$)/i) || text.match(/⚖️\s*\*\*?VALOR\*\*?.*?:(.*?)(?:\n|$)/i);
    const safeMatch = text.match(/🛡️\s*\*\*?SEGURA\*\*?.*?:?\s*\n?\s*\*\s*\*\*Selección:\*\*\s*(.*?)(?:\n|$)/i) || text.match(/🛡️\s*\*\*?SEGURA\*\*?.*?:(.*?)(?:\n|$)/i);
    
    let summary = "Ver ficha técnica";
    if (valueMatch) {
      summary = `💎 Valor: ${valueMatch[1].trim()}`;
    } else if (safeMatch) {
      summary = `🛡️ Segura: ${safeMatch[1].trim()}`;
    }

    if (summary.length > 50) summary = summary.substring(0, 47) + "...";

    return { title, summary };
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      const response = await sendMessageToGemini(text);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        groundingChunks: response.groundingChunks
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false,
      }));

      const { title, summary } = extractMatchDetails(response.text);
      const newHistoryItem: HistoryItem = {
        id: botMessage.id,
        timestamp: Date.now(),
        matchTitle: title,
        summary: summary,
        fullContent: response.text,
        groundingChunks: response.groundingChunks
      };

      setHistory((prev) => [newHistoryItem, ...prev]);

    } catch (error: any) {
      console.error(error);
      let errorText = "**Error Crítico:** Lo siento, no he podido conectar con la central de datos.";
      
      if (error.message && error.message.includes("API_KEY")) {
         errorText = "**Error de Configuración:** Falta la API Key. Por favor, verifica la configuración en Vercel.";
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorText,
        timestamp: new Date(),
        isError: true,
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("¿Borrar todo el historial de apuestas?")) {
        setHistory([]);
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Matadorbets AI',
      text: 'Te recomiendo este analista deportivo con IA. Analiza partidos usando Big Data en tiempo real.',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles. ¡Pásalo a tus amigos!');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-3 px-4 md:px-6 shadow-lg shadow-black/20 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-slate-800 p-1.5 rounded-full border border-slate-700 shadow-inner">
              <MatadorLogo size={32} className="md:w-[36px] md:h-[36px]" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white font-serif leading-tight">
                Matador<span className="text-rose-600">bets</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                </span>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                  AI Analyst
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex gap-4 text-[10px] uppercase tracking-wider text-slate-500 mr-2 font-semibold">
              <div className="flex items-center gap-1">
                  <TrendingUp size={12} className="text-blue-500" />
                  <span>xG Stats</span>
              </div>
              <div className="flex items-center gap-1">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span>Referee Risks</span>
              </div>
            </div>
            
            <button 
              onClick={handleShareApp}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
              title="Compartir App con amigos"
            >
              <Share2 size={20} />
            </button>

            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 transition-all text-sm font-medium"
            >
              <History size={16} />
              <span className="hidden sm:inline">Historial</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-grow overflow-y-auto p-4 md:p-6 scroll-smooth bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full justify-end">
          {chatState.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea 
        onSendMessage={handleSendMessage} 
        isLoading={chatState.isLoading} 
      />

      {/* History Modal */}
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};

export default App;