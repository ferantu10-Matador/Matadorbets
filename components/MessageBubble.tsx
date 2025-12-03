import React, { useState } from 'react';
import { Message } from '../types';
import { User, Globe, ExternalLink, Copy, Check } from 'lucide-react';
import { MatadorLogo } from './MatadorLogo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const cleanMarkdown = (markdown: string) => {
    return markdown
      // Headers
      .replace(/^#{1,6}\s+/gm, '')
      // Bold/Italic
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Blockquotes
      .replace(/^>\s+/gm, '')
      // Code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Links
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Tables: remove separator lines |---|---|
      .replace(/^\|?[\s-:|]+\|$/gm, '')
      // Tables: replace pipes with spaces
      .replace(/\|/g, ' ')
      // Extra whitespace cleanup
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handleCopy = async () => {
    if (!message.text) return;
    const textToCopy = cleanMarkdown(message.text);
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border shadow-lg ${
            isUser 
              ? 'bg-blue-600 border-blue-500' 
              : 'bg-slate-950 border-rose-900/50 shadow-rose-900/10'
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
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full overflow-hidden`}>
          
          {/* Text Bubble */}
          {message.text && (
            <div className={`px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md w-full relative group ${
              isUser 
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none border border-blue-500/30' 
                : 'bg-black/40 border border-slate-800 text-slate-200 rounded-tl-none shadow-black/40'
            }`}>
              
              {/* Copy Button (Only for AI) */}
              {!isUser && !message.isError && (
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/80 border border-slate-700/50 hover:border-emerald-500/30 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                  title="Copiar análisis limpio"
                >
                  {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              )}

              <div className="text-sm md:text-base leading-relaxed font-light message-markdown">
                {isUser ? (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Table Styles
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-5 rounded-xl border border-slate-800 bg-slate-900/20 shadow-lg">
                          <table className="w-full text-sm text-left text-slate-300 border-collapse" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => (
                        <thead className="text-xs text-rose-400/80 uppercase bg-slate-950/80 tracking-wider" {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th className="px-6 py-4 font-bold border-b border-slate-800 whitespace-nowrap" {...props} />
                      ),
                      tr: ({node, ...props}) => (
                        <tr className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 transition-colors" {...props} />
                      ),
                      td: ({node, children, ...props}) => {
                        // Helper to extract text to check for keywords
                        const getText = (nodes: React.ReactNode): string => {
                            if (typeof nodes === 'string') return nodes;
                            if (Array.isArray(nodes)) return nodes.map(getText).join('');
                            if (React.isValidElement(nodes) && nodes.props.children) return getText(nodes.props.children);
                            return '';
                        };

                        const textContent = getText(children);
                        let cellClass = "px-6 py-4 align-middle transition-colors";

                        // Conditional Coloring logic
                        if (/Alta|Verde|🟢/i.test(textContent)) {
                            cellClass += " text-emerald-400 font-bold bg-emerald-950/10";
                        } else if (/Media|🟡/i.test(textContent)) {
                             cellClass += " text-amber-400 font-bold";
                        } else if (/Riesgo|Baja|Rojo|🔴/i.test(textContent)) {
                            cellClass += " text-rose-400 font-bold bg-rose-950/10";
                        } else {
                            cellClass += " text-slate-300";
                        }

                        return (
                          <td className={cellClass} {...props}>
                            {children}
                          </td>
                        );
                      },

                      // Text Styles
                      p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-7" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-rose-400 font-bold" {...props} />,
                      em: ({node, ...props}) => <em className="text-slate-400 italic" {...props} />,
                      
                      // List Styles
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 marker:text-rose-500/80" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 marker:text-rose-500/80" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1 text-slate-300" {...props} />,

                      // Headings
                      h1: ({node, ...props}) => <h1 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4 flex items-center gap-3 border-b border-slate-800 pb-3" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-6 mb-3 flex items-center gap-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-bold text-rose-300 mt-4 mb-2 uppercase tracking-wide opacity-90" {...props} />,

                      // Quotes / Highlights (La Joya)
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-rose-600 bg-gradient-to-r from-rose-900/10 to-transparent pl-5 py-4 my-6 rounded-r-lg italic text-slate-300 shadow-sm" {...props} />
                      ),
                      
                      // Code
                      code: ({node, ...props}) => (
                        <code className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-200 font-mono text-xs border border-slate-700" {...props} />
                      ),
                      
                      // Horizontal Rule
                      hr: ({node, ...props}) => <hr className="border-slate-800 my-6" {...props} />
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                )}
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
            <div className="mt-3 bg-black/40 rounded-lg p-3 border border-slate-800/60 w-full max-w-lg">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-bold">
                <Globe size={10} />
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-rose-950/30 text-xs text-slate-400 hover:text-rose-400 rounded-md transition-all truncate max-w-full border border-slate-800 hover:border-rose-900/30 group"
                    >
                      <span className="truncate max-w-[150px] group-hover:underline decoration-rose-500/50 underline-offset-2">{chunk.web.title || "Fuente Web"}</span>
                      <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          
          <span className="text-[10px] text-slate-600 mt-2 px-1 font-mono opacity-60">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};