import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, ChevronDown, MoreHorizontal, Play, MessageSquare, CreditCard,
  Workflow, Mail, Bell, FileText, ToggleRight, ToggleLeft, Edit2, BarChart2,
  Wand2, ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  listAutomatizaciones,
  ejecutarAutomatizacion,
  toggleAutomatizacion,
} from '../services/automations';
import { getApiErrorMessage } from '../services/api';
import type { Automatizacion, AutomatizacionEstado } from '../types/api';

const TABS = ['Mis flujos', 'Plantillas', 'Ejecuciones', 'Historial'] as const;
type Tab = typeof TABS[number];

const templates = [
  { title: 'Cobro preventivo por WhatsApp', desc: 'Reduce la mora temprana con mensajes preventivos.', icon: MessageSquare, color: 'text-emerald-500' },
  { title: 'Secuencia de correos por mora', desc: 'Secuencia automática de correos según días de mora.', icon: Mail, color: 'text-indigo-500' },
  { title: 'Generación automática de acuerdos', desc: 'Crea acuerdos sugeridos en base a la capacidad de pago.', icon: FileText, color: 'text-amber-500' },
  { title: 'Alerta por riesgo de deserción', desc: 'Notifica automáticamente casos de alto riesgo detectados por IA.', icon: Bell, color: 'text-red-500' },
];

const ESTADO_LABEL: Record<AutomatizacionEstado, string> = {
  BORRADOR: 'Borrador',
  ACTIVA: 'Activo',
  PAUSADA: 'Pausado',
  COMPLETADA: 'Completada',
};

const ESTADO_BADGE: Record<AutomatizacionEstado, string> = {
  BORRADOR: 'bg-slate-100 text-slate-500',
  ACTIVA: 'bg-emerald-50 text-emerald-600',
  PAUSADA: 'bg-amber-50 text-amber-600',
  COMPLETADA: 'bg-blue-50 text-blue-600',
};

const ICON_PALETTE: { Icon: typeof Mail; color: string }[] = [
  { Icon: Mail,           color: 'bg-cyan-50 text-cyan-600' },
  { Icon: MessageSquare,  color: 'bg-amber-50 text-amber-600' },
  { Icon: FileText,       color: 'bg-indigo-50 text-indigo-600' },
  { Icon: Bell,           color: 'bg-pink-50 text-pink-600' },
  { Icon: Workflow,       color: 'bg-blue-50 text-blue-600' },
  { Icon: CreditCard,     color: 'bg-emerald-50 text-emerald-600' },
];

function iconFor(id: number) {
  return ICON_PALETTE[id % ICON_PALETTE.length] ?? ICON_PALETTE[0];
}

function triggerLabel(a: Automatizacion): string {
  const s = a.segmento_config ?? {};
  const parts: string[] = [];
  if (s.calificaciones?.length) parts.push(`Calif. ${s.calificaciones.join(', ')}`);
  if (typeof s.dias_mora_min === 'number') parts.push(`mora ≥ ${s.dias_mora_min}d`);
  if (typeof s.saldo_min === 'number') parts.push(`saldo ≥ $${s.saldo_min.toLocaleString('es-CO')}`);
  if (s.tipo_credito?.length) parts.push(s.tipo_credito.join('/'));
  return parts.length ? `Segmento: ${parts.join(' · ')}` : `${a.total_acciones} acciones`;
}

export function Automations() {
  const [activeTab, setActiveTab] = useState<Tab>('Mis flujos');
  const [flows, setFlows] = useState<Automatizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'TODOS' | AutomatizacionEstado>('TODOS');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAutomatizaciones();
      setFlows(list);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flows.filter((f) => {
      if (estadoFiltro !== 'TODOS' && f.estado !== estadoFiltro) return false;
      if (!q) return true;
      return (
        f.nombre.toLowerCase().includes(q) ||
        f.descripcion.toLowerCase().includes(q)
      );
    });
  }, [flows, search, estadoFiltro]);

  const stats = useMemo(() => {
    const activos = flows.filter((f) => f.estado === 'ACTIVA').length;
    const completadas = flows.filter((f) => f.estado === 'COMPLETADA').length;
    return { total: flows.length, activos, completadas };
  }, [flows]);

  const onToggle = async (a: Automatizacion) => {
    setBusyId(a.id);
    setActionMessage(null);
    try {
      const updated = await toggleAutomatizacion(a.id);
      setFlows((prev) => prev.map((f) => (f.id === a.id ? { ...f, estado: updated.estado } : f)));
      setActionMessage({ kind: 'ok', text: `${a.nombre}: ahora ${ESTADO_LABEL[updated.estado]}` });
    } catch (err) {
      setActionMessage({ kind: 'err', text: getApiErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  const onEjecutar = async (a: Automatizacion) => {
    setBusyId(a.id);
    setActionMessage(null);
    try {
      const res = await ejecutarAutomatizacion(a.id);
      if (res.estado === 'COMPLETADA') {
        setActionMessage({ kind: 'ok', text: `${a.nombre}: ${res.resultado.enviados} enviados, ${res.resultado.errores} errores` });
      } else {
        setActionMessage({ kind: 'err', text: `${a.nombre}: la ejecución terminó con errores (${res.resultado.errores})` });
      }
      void load();
    } catch (err) {
      setActionMessage({ kind: 'err', text: getApiErrorMessage(err) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox label="Flujos activos"        value={String(stats.activos)}     icon={Workflow}     color="text-cyan-500"    bg="bg-cyan-50"    sub={`de ${stats.total} totales`} />
        <StatBox label="Flujos completados"    value={String(stats.completadas)} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-50" sub="campañas cerradas" />
        <StatBox label="Ejecuciones hoy"       value="—"                          icon={Play}         color="text-indigo-500"  bg="bg-indigo-50"  sub="API pendiente" />
        <StatBox label="Recuperación generada" value="—"                          icon={CreditCard}   color="text-amber-500"   bg="bg-amber-50"   sub="API pendiente" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 xl:col-span-9 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
              {TABS.map((tab) => (
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
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value as typeof estadoFiltro)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVA">Activos</option>
                <option value="PAUSADA">Pausados</option>
                <option value="BORRADOR">Borrador</option>
                <option value="COMPLETADA">Completados</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar flujo..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 w-64"
                />
              </div>
            </div>
          </div>

          {actionMessage && (
            <div
              role="alert"
              className={clsx(
                'flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium border',
                actionMessage.kind === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              )}
            >
              {actionMessage.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{actionMessage.text}</span>
              <button onClick={() => setActionMessage(null)} className="ml-auto opacity-70 hover:opacity-100">×</button>
            </div>
          )}

          <div className="glass-card rounded-[2rem] overflow-hidden overflow-x-auto border-white/60">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin" />
                <p className="text-sm font-medium">Cargando automatizaciones...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <AlertCircle size={32} className="text-red-500" />
                <div>
                  <p className="text-sm font-bold text-navy-dark">No se pudieron cargar las automatizaciones</p>
                  <p className="text-xs text-slate-500 mt-1">{error}</p>
                </div>
                <button onClick={() => void load()} className="btn-primary flex items-center gap-2">
                  <RefreshCw size={14} /> Reintentar
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                <Workflow size={32} />
                <p className="text-sm font-medium">
                  {flows.length === 0 ? 'Aún no hay automatizaciones.' : 'Ningún flujo coincide con el filtro.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-100 uppercase tracking-widest text-[9px] font-bold text-slate-400">
                    <th className="px-6 py-6 font-bold">Flujo</th>
                    <th className="px-6 py-6 font-bold">Descripción</th>
                    <th className="px-6 py-6 font-bold">Estado</th>
                    <th className="px-6 py-6 font-bold">Acciones</th>
                    <th className="px-6 py-6 font-bold">Última ejecución</th>
                    <th className="px-6 py-6 font-bold text-right">Operaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((flow) => {
                    const { Icon, color } = iconFor(flow.id);
                    const isBusy = busyId === flow.id;
                    const isActive = flow.estado === 'ACTIVA';
                    return (
                      <tr key={flow.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
                              <Icon size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-navy-dark">{flow.nombre}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{triggerLabel(flow)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 max-w-[280px]">
                          <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{flow.descripcion}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className={clsx('px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest', ESTADO_BADGE[flow.estado])}>
                              {ESTADO_LABEL[flow.estado]}
                            </span>
                            <button
                              onClick={() => void onToggle(flow)}
                              disabled={isBusy || flow.estado === 'COMPLETADA' || flow.estado === 'BORRADOR'}
                              title={flow.estado === 'COMPLETADA' || flow.estado === 'BORRADOR' ? 'No aplicable' : isActive ? 'Pausar' : 'Activar'}
                              className="disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isBusy ? (
                                <Loader2 size={20} className="animate-spin text-slate-400" />
                              ) : isActive ? (
                                <ToggleRight size={28} className="text-emerald-500" />
                              ) : (
                                <ToggleLeft size={28} className="text-slate-300" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-bold text-navy-dark">{flow.total_acciones}</span>
                          <span className="text-[10px] text-slate-400 ml-1">pasos</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {flow.ultima_ejecucion
                              ? new Date(flow.ultima_ejecucion).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
                              : '—'}
                          </span>
                          {flow.ultimo_estado && (
                            <p className={clsx(
                              'text-[9px] font-bold uppercase tracking-widest mt-0.5',
                              flow.ultimo_estado === 'COMPLETADA' && 'text-emerald-500',
                              flow.ultimo_estado === 'ERROR' && 'text-red-500',
                              flow.ultimo_estado === 'EJECUTANDO' && 'text-amber-500',
                              flow.ultimo_estado === 'PENDIENTE' && 'text-slate-400',
                            )}>
                              {flow.ultimo_estado}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => void onEjecutar(flow)}
                              disabled={isBusy || flow.estado !== 'ACTIVA'}
                              title={flow.estado !== 'ACTIVA' ? 'Solo flujos ACTIVOS pueden ejecutarse' : 'Ejecutar ahora'}
                              className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            </button>
                            <button className="p-2 rounded-lg text-slate-400 hover:text-navy-dark hover:bg-slate-100 transition-colors">
                              <BarChart2 size={16} />
                            </button>
                            <button className="p-2 rounded-lg text-slate-400 hover:text-navy-dark hover:bg-slate-100 transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button className="p-2 rounded-lg text-slate-400 hover:text-navy-dark hover:bg-slate-100 transition-colors">
                              <MoreHorizontal size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-400">
                  Mostrando {filtered.length} de {flows.length} {flows.length === 1 ? 'flujo' : 'flujos'}
                </p>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300" disabled>
                    <ChevronLeft size={16} />
                  </button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-navy-dark font-bold text-xs">1</button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300" disabled>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-3 space-y-8">
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

          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
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
                Próximamente: AURA analizará el rendimiento de tus flujos y sugerirá optimizaciones automáticas.
              </p>
              <div className="w-full space-y-2">
                <button className="w-full bg-slate-100 text-slate-400 font-bold py-3.5 rounded-2xl text-[11px] cursor-not-allowed" disabled>
                  Próximamente
                </button>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 blur-3xl animate-pulse-slow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatBoxProps {
  label: string; value: string; icon: typeof Workflow; color: string; bg: string; sub: string;
}
function StatBox({ label, value, icon: Icon, color, bg, sub }: StatBoxProps) {
  return (
    <div className="glass-card rounded-3xl p-6 flex items-center gap-5">
      <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm', bg, color)}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-extrabold text-navy-dark leading-tight">{value}</p>
        <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>
      </div>
    </div>
  );
}
