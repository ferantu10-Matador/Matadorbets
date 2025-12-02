import React from 'react';
import { Message } from '../types';
import { User, Globe, ExternalLink } from 'lucide-react';
import { MatadorLogo } from './MatadorLogo';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Function to render formatted text with bolding
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Basic bold parsing for **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={index} className={`min-h-[1.5em] ${line.trim() === '' ? 'h-2' : ''}`}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // Changed accent color to Rose/Red for bold text
              return <strong key={i} className="text-rose-400 font-bold">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border shadow-lg ${
            isUser 
              ? 'bg-blue-600 border-blue-500' 
              : 'bg-slate-900 border-rose-900'
          }`}>
          {isUser ? (
            <User size={20} className="text-white" />
          ) : (
            <div className="scale-75 mt-1">
               <MatadorLogo size={32} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
          
          {/* Text Bubble - Only show if there is text */}
          {message.text && (
            <div className={`px-5 py-4 rounded-2xl shadow-xl backdrop-blur-sm ${
              isUser 
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none border border-blue-500/30' 
                : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none'
            }`}>
              <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-light">
                {renderFormattedText(message.text)}
              </div>
            </div>
          )}

          {/* Custom Content (Setup Guide, etc.) */}
          {message.customContent && (
             <div className="mt-2 w-full">
                {message.customContent}
             </div>
          )}

          {/* Grounding Sources (Google Search Results) */}
          {!isUser && message.groundingChunks && message.groundingChunks.length > 0 && (
            <div className="mt-3 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 w-full max-w-lg">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">
                <Globe size={12} />
                Fuentes del Matador
              </div>
              <div className="flex flex-wrap gap-2">
                {message.groundingChunks.map((chunk, idx) => {
                  if (!chunk.web?.uri) return null;
                  return (
                    <a
                      key={idx}
                      href={chunk.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-xs text-rose-300 rounded-full transition-colors truncate max-w-full border border-slate-700 hover:border-rose-700/50"
                    >
                      <span className="truncate max-w-[150px]">{chunk.web.title || "Fuente Web"}</span>
                      <ExternalLink size={10} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          
          <span className="text-xs text-slate-600 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};