import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatState, HistoryItem, ViewType } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { INITIAL_MESSAGE } from './constants';
import { MatadorLogo } from './components/MatadorLogo';
import { TrendingUp, AlertTriangle, Share2, Menu } from 'lucide-react';
import { SetupGuide } from './components/SetupGuide';
import { Sidebar } from './components/Sidebar';
import { MatchesView } from './components/MatchesView';
import { StatsView } from './components/StatsView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('matches'); // Defaulting to matches for new flow
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for API Key on mount and show guide if missing
  useEffect(() => {
    // @ts-ignore
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        setChatState((prev) => ({
            ...prev,
            messages: [
                ...prev.messages,
                {
                    id: 'setup-guide',
                    role: 'model',
                    text: '',
                    timestamp: new Date(),
                    customContent: <SetupGuide />
                }
            ]
        }));
    }
  }, []);

  const scrollToBottom = () => {
    if (currentView === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, currentView]);

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

    } catch (error: any) {
      console.error(error);
      let errorText = "**Error Crítico:** Lo siento, no he podido conectar con la central de datos.";
      let customContent = undefined;
      
      if (error.message && error.message.includes("API_KEY")) {
         errorText = "";
         customContent = <SetupGuide />;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorText,
        timestamp: new Date(),
        isError: true,
        customContent: customContent
      };

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));
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
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView}
        onChangeView={setCurrentView}
      />

      {/* Header */}
      <header className="flex-shrink-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-3 px-4 md:px-6 shadow-lg shadow-black/20 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Hamburger Button */}
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Menu"
            >
                <Menu size={24} />
            </button>

            <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:block bg-slate-800 p-1.5 rounded-full border border-slate-700 shadow-inner">
                   <MatadorLogo size={32} className="md:w-[36px] md:h-[36px]" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold tracking-tight text-white font-serif leading-tight">
                    Matador<span className="text-rose-600">bets</span>
                  </h1>
                  <p className="hidden md:block text-[9px] md:text-[10px] text-slate-400 font-medium tracking-widest uppercase">
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
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto scroll-smooth bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
            
            {/* View: Chat */}
            <div className={`flex flex-col flex-grow justify-end ${currentView === 'chat' ? 'block' : 'hidden'}`}>
                <div className="p-4 md:p-6 pb-2">
                    {chatState.messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* View: Matches */}
            {currentView === 'matches' && (
                <MatchesView />
            )}

            {/* View: Stats */}
            {currentView === 'stats' && (
                <StatsView />
            )}
        </div>
      </main>

      {/* Input Area (Only visible in Chat) */}
      {currentView === 'chat' && (
         <InputArea 
            onSendMessage={handleSendMessage} 
            isLoading={chatState.isLoading} 
         />
      )}
    </div>
  );
};

export default App;