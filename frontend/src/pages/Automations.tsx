import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  MoreHorizontal, 
  Play, 
  MessageSquare, 
  CreditCard, 
  Workflow, 
  Mail, 
  Bell, 
  Phone, 
  FileText, 
  Calendar, 
  Star, 
  GraduationCap,
  ToggleRight,
  ToggleLeft,
  Edit2,
  BarChart2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wand2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { clsx } from 'clsx';

const stats = [
  { label: 'Flujos activos', value: '24', trend: '+ 2 vs mes anterior', icon: Workflow, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { label: 'Ejecuciones hoy', value: '340', trend: '↑ 18% vs ayer', icon: Play, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { label: 'Mensajes enviados hoy', value: '1.245', trend: '↑ 22% vs ayer', icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50' },
  { label: 'Recuperación generada', value: '$ 48.750.000', trend: '↑ 15% vs mes anterior', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const flows = [
  {
    id: 1,
    name: 'Recordatorio pre-vencimiento',
    trigger: 'Disparador: 3 días antes del vencimiento',
    description: 'Envía recordatorios por WhatsApp y correo antes del vencimiento de la cuota.',
    status: 'Activo',
    executions: '532',
    execTrend: '↑ 20%',
    recovery: '$ 18.450.000',
    recTrend: '↑ 12%',
    icon: Mail,
    iconColor: 'bg-cyan-50 text-cyan-600',
  },
  {
    id: 2,
    name: 'Seguimiento mora 1-30 días',
    trigger: 'Disparador: 1 día en mora',
    description: 'Secuencia de 3 mensajes por WhatsApp y correo para mora temprana.',
    status: 'Activo',
    executions: '873',
    execTrend: '↑ 15%',
    recovery: '$ 12.980.000',
    recTrend: '↑ 18%',
    icon: MessageSquare,
    iconColor: 'bg-amber-50 text-amber-600',
  },
  {
    id: 3,
    name: 'Llamada automática mora 31-60',
    trigger: 'Disparador: 31 días en mora',
    description: 'Genera tarea de llamada y registra el resultado automáticamente.',
    status: 'Activo',
    executions: '245',
    execTrend: '↑ 8%',
    recovery: '$ 6.750.000',
    recTrend: '↑ 10%',
    icon: Phone,
    iconColor: 'bg-red-50 text-red-600',
  },
  {
    id: 4,
    name: 'Oferta de acuerdo inteligente',
    trigger: 'Disparador: 60 días en mora',
    description: 'Envía oferta de acuerdo personalizada según capacidad de pago predictiva.',
    status: 'Activo',
    executions: '121',
    execTrend: '↑ 25%',
    recovery: '$ 7.650.000',
    recTrend: '↑ 22%',
    icon: FileText,
    iconColor: 'bg-indigo-50 text-indigo-600',
  },
  {
    id: 5,
    name: 'Seguimiento acuerdo próximo a vencer',
    trigger: 'Disparador: 3 días antes del vencimiento',
    description: 'Recuerda al estudiante su acuerdo próximo a vencer.',
    status: 'Activo',
    executions: '412',
    execTrend: '↑ 17%',
    recovery: '$ 2.920.000',
    recTrend: '↑ 9%',
    icon: Calendar,
    iconColor: 'bg-blue-50 text-blue-600',
  },
  {
    id: 6,
    name: 'Reactivación estudiantes inactivos',
    trigger: 'Disparador: 15 días sin pago ni contacto',
    description: 'Secuencia multicanal para reactivar estudiantes inactivos.',
    status: 'Pausado',
    executions: '0',
    execTrend: '—',
    recovery: '$ 0',
    recTrend: '—',
    icon: Star,
    iconColor: 'bg-pink-50 text-pink-600',
  },
  {
    id: 7,
    name: 'Bienvenida nuevos estudiantes',
    trigger: 'Disparador: Matrícula confirmada',
    description: 'Mensaje de bienvenida + información financiera importante.',
    status: 'Activo',
    executions: '156',
    execTrend: '↑ 30%',
    recovery: '$ 1.150.000',
    recTrend: '↑ 14%',
    icon: GraduationCap,
    iconColor: 'bg-purple-50 text-purple-600',
  },
];

const templates = [
  { title: 'Cobro preventivo por WhatsApp', desc: 'Reduce la mora temprana con mensajes preventivos.', icon: MessageSquare, color: 'text-emerald-500' },
  { title: 'Secuencia de correos por mora', desc: 'Secuencia automática de correos según días de mora.', icon: Mail, color: 'text-indigo-500' },
  { title: 'Generación automática de acuerdos', desc: 'Crea acuerdos sugeridos en base a la capacidad de pago.', icon: FileText, color: 'text-amber-500' },
  { title: 'Alerta por riesgo de deserción', desc: 'Notifica automáticamente casos de alto riesgo detectados por IA.', icon: Bell, color: 'text-red-500' },
];

export function Automations() {
  const [activeTab, setActiveTab] = useState('Mis flujos');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-navy-dark">Automatizaciones</h2>
            <Wand2 className="text-indigo-500 w-5 h-5" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Diseña, activa y monitorea flujos automáticos que te ayudan a gestionar, comunicar y recuperar de manera inteligente.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#006875] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#004f58] transition-all">
          <Plus size={20} />
          <span>Nueva automatización</span>
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-3xl p-6 flex items-center gap-5">
            <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm', stat.bg, stat.color)}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-xl font-extrabold text-navy-dark leading-tight">{stat.value}</p>
              <p className="text-[10px] font-bold text-emerald-500 mt-1">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-12 xl:col-span-9 space-y-6">
          {/* Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
              {['Mis flujos', 'Plantillas', 'Ejecuciones', 'Historial'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-6 py-2 rounded-lg text-xs font-bold transition-all',
                    activeTab === tab ? 'bg-white text-navy-dark shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors">
                Todos los estados <ChevronDown size={14} />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar flujo..." 
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 w-64"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-card rounded-[2rem] overflow-hidden overflow-x-auto border-white/60">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100 uppercase tracking-widest text-[9px] font-bold text-slate-400">
                  <th className="px-6 py-6 font-bold">Flujo</th>
                  <th className="px-6 py-6 font-bold">Descripción</th>
                  <th className="px-6 py-6 font-bold">Estado</th>
                  <th className="px-6 py-6 font-bold">Ejecuciones (30 días)</th>
                  <th className="px-6 py-6 font-bold">Recuperación (30 días)</th>
                  <th className="px-6 py-6 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {flows.map((flow) => (
                  <tr key={flow.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', flow.iconColor)}>
                          <flow.icon size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-navy-dark">{flow.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{flow.trigger}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 max-w-[240px]">
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{flow.description}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <span className={clsx(
                           'px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest',
                           flow.status === 'Activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                         )}>
                           {flow.status}
                         </span>
                         <button className="text-emerald-500">
                           {flow.status === 'Activo' ? <ToggleRight size={28} /> : <ToggleLeft className="text-slate-300" size={28} />}
                         </button>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy-dark">{flow.executions}</span>
                        {flow.execTrend !== '—' && <span className="text-[9px] font-bold text-emerald-500">{flow.execTrend}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy-dark">{flow.recovery}</span>
                        {flow.recTrend !== '—' && <span className="text-[9px] font-bold text-emerald-500">{flow.recTrend}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="hover:bg-slate-100 p-2 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-navy-dark">
                          <BarChart2 size={16} />
                        </div>
                        <div className="hover:bg-slate-100 p-2 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-navy-dark">
                          <Edit2 size={16} />
                        </div>
                        <div className="hover:bg-slate-100 p-2 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-navy-dark">
                          <MoreHorizontal size={16} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between">
              <p className="text-[11px] font-medium text-slate-400">Mostrando 1 a 7 de 24 flujos</p>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                  <ChevronLeft size={16} />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-navy-dark font-bold text-xs">1</button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs hover:bg-slate-100">2</button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs hover:bg-slate-100">3</button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs hover:bg-slate-100">4</button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-12 xl:col-span-3 space-y-8">
          {/* Templates Component */}
          <div className="glass-card rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-dark">Plantillas recomendadas</h3>
              <a href="#" className="text-[10px] font-bold text-[#006875] hover:underline uppercase tracking-widest">Ver todas</a>
            </div>
            <div className="space-y-4">
              {templates.map((tpl, i) => (
                <div key={i} className="group p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={clsx('w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0', tpl.color)}>
                      <tpl.icon size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[11px] font-bold text-navy-dark truncate leading-none">{tpl.title}</p>
                    </div>
                    <button className="shrink-0 bg-white border border-slate-200 px-3 py-1 rounded-lg text-[9px] font-bold text-navy-dark hover:bg-[#00e5ff] hover:border-[#00e5ff] transition-colors">Usar</button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2">{tpl.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Optimizer Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
             {/* Sparkles effect */}
             <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <Wand2 className="text-indigo-500 w-4 h-4 animate-pulse" />
             </div>
             
             <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                <div className="flex items-center gap-3 self-start mb-2">
                   <img src="/AURA_1.png" alt="AURA" className="w-12 h-12 object-contain drop-shadow-lg animate-float shrink-0" />
                   <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-navy-dark">AURA</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      </div>
                      <p className="text-[9px] font-medium text-slate-400 leading-none">Tu asistente inteligente</p>
                   </div>
                </div>

                <p className="text-xs font-medium text-slate-600 leading-relaxed text-left">
                  Hola, soy AURA. He detectado que el flujo <span className="font-bold text-navy-dark">"Seguimiento mora 1-30 días"</span> de SIRA puede mejorar su rendimiento.
                </p>
                <div className="w-full p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 text-left">
                   <p className="text-[11px] font-bold text-indigo-600 mb-1">¿Quieres que optimice el contenido de los mensajes?</p>
                </div>

                <div className="w-full space-y-2">
                   <button className="w-full bg-[#00e5ff] text-navy-dark font-bold py-3.5 rounded-2xl text-[11px] shadow-[0_10px_20px_-5px_rgba(0,229,255,0.4)] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Optimizar flujo
                   </button>
                   <button className="w-full py-3.5 text-[11px] font-bold text-slate-500 hover:text-navy-dark transition-colors">
                      Ver análisis
                   </button>
                </div>
             </div>

             {/* Illustration Mascot in corner */}
             <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 blur-3xl animate-pulse-slow" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
