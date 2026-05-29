import { motion } from 'motion/react';
import { MessageSquare, Send, X, MoreHorizontal, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

import { TOKEN_KEY } from '../services/api';

const AURA_ENDPOINT = 'https://mzautobuss.com/aura/chat';
const HISTORY_KEY = 'aura_chat_history';
const MESSAGES_KEY = 'aura_chat_messages';

type ChatTurn = { role: string; content: string };
type Message = { id: number; role: 'user' | 'bot'; text: string };

const WELCOME_MESSAGE: Message = {
  id: 0,
  role: 'bot',
  text: '¡Hola! Soy AURA. Pregúntame sobre cartera, estudiantes, acuerdos, gestiones y más.',
};

const markdownComponents: Components = {
  p: ({ children }) => <p className="text-slate-600 mb-1 text-[12px] leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-slate-800">{children}</strong>,
  h1: ({ children }) => <h1 className="font-bold text-slate-800 text-sm mt-2 mb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="font-bold text-slate-800 text-sm mt-2 mb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="font-bold text-slate-800 text-xs mt-2 mb-1">{children}</h3>,
  ul: ({ children }) => <ul className="mb-2 ml-3 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-3 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="text-slate-600 text-[12px] mb-0.5">{children}</li>,
  code: ({ children }) => <code className="bg-slate-100 px-1 rounded text-[11px] font-mono">{children}</code>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-300 pl-2 text-slate-500 italic">{children}</blockquote>,
};

const getSessionId = (): string => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return 'user_anonymous';
    const parts = token.split('.');
    if (parts.length < 2) return 'user_anonymous';
    const payload = JSON.parse(atob(parts[1])) as { id?: unknown; sub?: unknown };
    return `user_${payload.id ?? payload.sub ?? 'unknown'}`;
  } catch {
    return 'user_anonymous';
  }
};

const loadHistory = (): ChatTurn[] => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    const parsed = saved ? (JSON.parse(saved) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as ChatTurn[]) : [];
  } catch {
    return [];
  }
};

const loadMessages = (): Message[] => {
  try {
    const saved = localStorage.getItem(MESSAGES_KEY);
    const parsed = saved ? (JSON.parse(saved) as unknown) : null;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Message[];
  } catch {
    /* fallthrough */
  }
  return [WELCOME_MESSAGE];
};

export function AuraAssistant() {
  const [isOpen, setIsOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>(loadHistory);
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const persistMessages = (next: Message[]) => {
    setMessages(next);
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
    } catch {
      /* storage lleno */
    }
  };

  const persistHistory = (next: ChatTurn[]) => {
    setChatHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const sendMessage = async (userMessage: string) => {
    const trimmed = userMessage.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text: trimmed };
    const afterUser = [...messages, userMsg];
    persistMessages(afterUser);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(AURA_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          history: chatHistory,
          session_id: getSessionId(),
          agente: null,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { response?: unknown; history?: unknown };

      if (Array.isArray(data.history)) {
        persistHistory(data.history as ChatTurn[]);
      }

      const botText =
        typeof data.response === 'string' && data.response.trim()
          ? data.response
          : 'AURA no pudo procesar tu consulta. Intenta de nuevo.';

      persistMessages([
        ...afterUser,
        { id: Date.now() + 1, role: 'bot', text: botText },
      ]);
    } catch {
      persistMessages([
        ...afterUser,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: 'No pude conectarme con AURA. Verifica tu conexión e intenta de nuevo.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(inputValue);
    }
  };

  const canSend = !isLoading && inputValue.trim().length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative mb-2"
          >
            <img
              src="/AURA_1.png"
              alt="AURA"
              className="absolute -top-36 right-4 w-52 h-52 object-contain drop-shadow-2xl animate-float pointer-events-none z-10"
            />

            <div className="w-[440px] h-[630px] glass-card rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/60">
              {/* Header */}
              <div className="bg-navy-dark pt-6 pb-4 px-4 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">AURA</h3>
                  <p className="text-[10px] text-slate-400">Tu asistente inteligente</p>
                </div>
                <div className="flex items-center gap-2">
                  <MoreHorizontal size={18} className="text-slate-400 cursor-pointer" />
                  <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto bg-slate-50/50"
              >
                {messages.map((m) =>
                  m.role === 'user' ? (
                    <div
                      key={m.id}
                      className="self-end max-w-[80%] bg-[#00e5ff] text-navy-dark p-3 rounded-2xl rounded-tr-none text-xs font-medium shadow-sm whitespace-pre-line"
                    >
                      {m.text}
                    </div>
                  ) : (
                    <div key={m.id} className="self-start max-w-[85%] flex gap-2">
                      <img
                        src="/AURA_1.png"
                        alt="AURA"
                        className="mt-1 w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      <div className="flex flex-col gap-2">
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm leading-relaxed border border-slate-100">
                          <p className="font-bold mb-2 text-[12px]">AURA</p>
                          <ReactMarkdown components={markdownComponents}>
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {isLoading && (
                  <div className="self-start max-w-[85%] flex gap-2">
                    <img
                      src="/AURA_1.png"
                      alt="AURA"
                      className="mt-1 w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-1 text-slate-400">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    placeholder="Escribe tu consulta aquí..."
                    className="w-full bg-slate-50 border border-slate-150 rounded-2xl py-3 pl-4 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 disabled:opacity-60"
                  />
                  <button
                    onClick={() => void sendMessage(inputValue)}
                    disabled={!canSend}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-[#00e5ff] text-navy-dark flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-3 px-6">
                  Puedes consultar sobre cartera, estudiantes, acuerdos, gestiones y más.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-20 h-20 flex items-center justify-center"
        >
          {isOpen ? (
            <div className="w-8 h-8 rounded-full bg-navy-dark/80 flex items-center justify-center shadow-lg">
              <X size={18} className="text-white" />
            </div>
          ) : (
            <img src="/AURA_1.png" alt="AURA" className="w-20 h-20 object-contain drop-shadow-2xl" />
          )}
        </motion.button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function UsersIcon({ size, className }: { size: number; className: string }) {
  return (
    <div className={className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
  );
}

void MessageSquare;
void ChevronRight;