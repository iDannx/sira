import { motion } from 'motion/react';
import { MessageSquare, Send, X, MoreHorizontal, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function AuraAssistant() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative mb-2"
          >
            {/* Mascota grande flotando por encima del chat */}
            <img
              src="/AURA_1.png"
              alt="AURA"
              className="absolute -top-36 right-4 w-52 h-52 object-contain drop-shadow-2xl animate-float pointer-events-none z-10"
            />

            {/* Panel del chat — overflow-hidden separado del wrapper para no cortar la mascota */}
            <div className="w-[380px] h-[550px] glass-card rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/60">
              {/* Chat Header */}
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

              {/* Chat Content */}
              <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto bg-slate-50/50">
                <div className="self-end max-w-[80%] bg-[#00e5ff] text-navy-dark p-3 rounded-2xl rounded-tr-none text-xs font-medium shadow-sm">
                  Dame el listado de estudiantes con cartera vencida a día de hoy.
                </div>

                <div className="self-start max-w-[85%] flex gap-2">
                  <img src="/AURA_1.png" alt="AURA" className="mt-1 w-6 h-6 rounded-full object-cover shrink-0" />
                  <div className="flex flex-col gap-2">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-[12px] leading-relaxed border border-slate-100">
                      <p className="font-bold mb-2">AURA</p>
                      <p className="text-slate-600">Claro, aquí tienes el listado de estudiantes con cartera vencida a día de hoy:</p>

                      <button className="flex items-center justify-between w-full mt-4 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-3">
                          <UsersIcon className="text-slate-400" size={16} />
                          <span className="text-[11px] font-semibold text-slate-700 font-sans">Ver listado (612 estudiantes)</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-slate-600 text-[12px]">¿Te gustaría filtrar por algún programa o rango de mora?</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Escribe tu consulta aquí..."
                    className="w-full bg-slate-50 border border-slate-150 rounded-2xl py-3 pl-4 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-[#00e5ff] text-navy-dark flex items-center justify-center hover:scale-105 transition-transform">
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

function UsersIcon({ size, className }: { size: number, className: string }) {
  return (
    <div className={className}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    </div>
  );
}
