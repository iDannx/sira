import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  Search, Filter, Phone, Mail, MessageSquare, Plus, X, Eye, Calendar,
  CheckCircle2, AlertCircle, Clock, ShieldAlert, Gavel, ChevronLeft, ChevronRight,
  TrendingUp, Users, Sparkles, Bot, User as UserIcon, Send, DollarSign,
  Loader2, RefreshCw,
} from 'lucide-react';
import {
  getResumenGestiones,
  listGestiones,
  listPromesas,
  listJuridica,
  getGestion,
  crearGestion,
  type ResumenGestiones,
  type ListGestionesParams,
  type EstadoPromesa,
} from '../services/gestiones';
import { getApiErrorMessage } from '../services/api';
import type {
  Gestion,
  CanalGestion,
  ResultadoGestion,
  Calificacion,
  EstadoJuridico,
  OrigenGestion,
} from '../data/gestionesMock';

// ── Helpers ──────────────────────────────────────────────
const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const formatCOPCompact = (v: number) => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)} MM`;
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)} M`;
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)} K`;
  return formatCOP(v);
};

const formatFecha = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const diasHastaFecha = (iso: string) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
};

const formatGestionId = (id: number) => `G-${String(id).padStart(4, '0')}`;

// ── Badges ───────────────────────────────────────────────
const CANAL_META: Record<CanalGestion, { bg: string; text: string; Icon: typeof MessageSquare; label: string }> = {
  whatsapp: { bg: 'bg-emerald-50', text: 'text-emerald-600', Icon: MessageSquare, label: 'WhatsApp' },
  llamada:  { bg: 'bg-blue-50',    text: 'text-blue-600',    Icon: Phone,         label: 'Llamada' },
  email:    { bg: 'bg-indigo-50',  text: 'text-indigo-600',  Icon: Mail,          label: 'Email' },
  sms:      { bg: 'bg-cyan-50',    text: 'text-cyan-600',    Icon: MessageSquare, label: 'SMS' },
};

const RESULTADO_BADGE: Record<ResultadoGestion, { bg: string; text: string; label: string }> = {
  enviado:       { bg: 'bg-blue-50',    text: 'text-blue-600',    label: 'Enviado' },
  promesa_pago:  { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Promesa de pago' },
  no_contesta:   { bg: 'bg-slate-100',  text: 'text-slate-500',   label: 'No contesta' },
  rechazado:     { bg: 'bg-red-50',     text: 'text-red-600',     label: 'Rechazado' },
};

const CALIF_BADGE: Record<Calificacion, string> = {
  A: 'bg-emerald-50 text-emerald-600',
  B: 'bg-blue-50    text-blue-600',
  C: 'bg-amber-50   text-amber-600',
  D: 'bg-orange-50  text-orange-600',
  E: 'bg-red-50     text-red-600',
};

const JUR_BADGE: Record<EstadoJuridico, { bg: string; text: string; label: string }> = {
  SIN_PROCESO:  { bg: 'bg-slate-100',  text: 'text-slate-500',   label: 'Sin proceso' },
  PREJURIDICO:  { bg: 'bg-amber-50',   text: 'text-amber-600',   label: 'Prejurídico' },
  JURIDICO:     { bg: 'bg-orange-50',  text: 'text-orange-600',  label: 'Jurídico' },
  ACUERDO_PAGO: { bg: 'bg-cyan-50',    text: 'text-cyan-600',    label: 'Acuerdo de pago' },
  SENTENCIA:    { bg: 'bg-violet-50',  text: 'text-violet-600',  label: 'Sentencia' },
  EMBARGO:      { bg: 'bg-red-50',     text: 'text-red-600',     label: 'Embargo' },
};

const JUR_ALERTA: Partial<Record<EstadoJuridico, { borderColor: string; bgRow: string }>> = {
  PREJURIDICO: { borderColor: 'border-l-amber-400',  bgRow: 'bg-amber-50/40' },
  JURIDICO:    { borderColor: 'border-l-orange-500', bgRow: 'bg-orange-50/40' },
  EMBARGO:     { borderColor: 'border-l-red-500',    bgRow: 'bg-red-50/40' },
};

type TabKey = 'todas' | 'promesas' | 'juridica';
const PAGE_SIZE = 8;

// ── Componente principal ─────────────────────────────────
export function Gestiones() {
  const [activeTab, setActiveTab] = useState<TabKey>('todas');
  const [subPromesas, setSubPromesas] = useState<EstadoPromesa>('proximas');

  // Filtros del Tab 1
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [canalFiltro, setCanalFiltro] = useState<'todos' | CanalGestion>('todos');
  const [resultadoFiltro, setResultadoFiltro] = useState<'todos' | ResultadoGestion>('todos');
  const [califFiltro, setCalifFiltro] = useState<'todos' | Calificacion>('todos');
  const [jurFiltro, setJurFiltro] = useState<'todos' | EstadoJuridico>('todos');
  const [fechaFiltro, setFechaFiltro] = useState<'todos' | 'hoy' | 'semana' | 'mes'>('todos');
  const [page, setPage] = useState(1);

  const [resumen, setResumen] = useState<ResumenGestiones | null>(null);
  const [items, setItems] = useState<Gestion[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [promesas, setPromesas] = useState<Gestion[]>([]);
  const [promesasLoading, setPromesasLoading] = useState(false);
  const [juridica, setJuridica] = useState<Gestion[]>([]);
  const [juridicaLoading, setJuridicaLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNueva, setShowNueva] = useState(false);

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Params del listado Tab 1
  const params = useMemo<ListGestionesParams>(() => ({
    page,
    limit: PAGE_SIZE,
    search: searchDebounced || undefined,
    canal: canalFiltro === 'todos' ? undefined : canalFiltro,
    resultado: resultadoFiltro === 'todos' ? undefined : resultadoFiltro,
    calificacion: califFiltro === 'todos' ? undefined : califFiltro,
    estadoJuridico: jurFiltro === 'todos' ? undefined : jurFiltro,
    rangoFecha: fechaFiltro === 'todos' ? undefined : fechaFiltro,
  }), [page, searchDebounced, canalFiltro, resultadoFiltro, califFiltro, jurFiltro, fechaFiltro]);

  // Carga resumen + listado Tab 1
  const loadTodas = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, listed] = await Promise.all([
        getResumenGestiones(),
        listGestiones(params),
      ]);
      setResumen(r);
      setItems(listed.items);
      setTotalItems(listed.meta.total);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTodas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Carga promesas cuando cambian subtab o activamos tab promesas
  useEffect(() => {
    if (activeTab !== 'promesas') return;
    setPromesasLoading(true);
    listPromesas(subPromesas)
      .then(setPromesas)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setPromesasLoading(false));
  }, [activeTab, subPromesas]);

  // Carga jurídica cuando activamos tab jurídica
  useEffect(() => {
    if (activeTab !== 'juridica') return;
    setJuridicaLoading(true);
    listJuridica()
      .then(setJuridica)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setJuridicaLoading(false));
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const handleLimpiar = () => {
    setSearch(''); setCanalFiltro('todos'); setResultadoFiltro('todos');
    setCalifFiltro('todos'); setJurFiltro('todos'); setFechaFiltro('todos'); setPage(1);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-navy-dark">Gestiones</h2>
            <MessageSquare className="text-[#006875] w-5 h-5" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Historial y seguimiento de contactos con clientes.
          </p>
        </div>
        <button
          onClick={() => setShowNueva(true)}
          className="flex items-center gap-2 bg-[#006875] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#004f58] transition-all"
        >
          <Plus size={18} /> Nueva gestión
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Gestiones ejecutadas" value={String(resumen?.totalGestiones ?? 0)}      sub="período total"        Icon={Sparkles}     color="indigo" />
        <KpiCard title="Promesas activas"     value={String(resumen?.promesasActivas ?? 0)}     sub={`${formatCOPCompact(resumen?.montoComprometido ?? 0)} comprometidos`} Icon={CheckCircle2} color="emerald" />
        <KpiCard title="Tasa de contacto"     value={`${(resumen?.tasaContacto ?? 0).toFixed(1)}%`} sub="contactos efectivos"  Icon={TrendingUp}   color="blue" />
        <KpiCard title="Vencen esta semana"   value={String(resumen?.promesasProximasSemana ?? 0)} sub="promesas próximas"     Icon={Clock}        color="purple" />
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <Tab active={activeTab === 'todas'}    onClick={() => setActiveTab('todas')}    Icon={MessageSquare} label="Todas las gestiones" />
        <Tab active={activeTab === 'promesas'} onClick={() => setActiveTab('promesas')} Icon={CheckCircle2}  label="Promesas de pago" />
        <Tab active={activeTab === 'juridica'} onClick={() => setActiveTab('juridica')} Icon={Gavel}         label="Cartera jurídica" />
      </div>

      {activeTab === 'todas' && (
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar cliente o número de crédito..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect label="Canal"     value={canalFiltro}     onChange={(v) => { setCanalFiltro(v as typeof canalFiltro); setPage(1); }}
                options={[{value:'todos',label:'Todos'},{value:'whatsapp',label:'WhatsApp'},{value:'llamada',label:'Llamada'},{value:'email',label:'Email'},{value:'sms',label:'SMS'}]} />
              <FilterSelect label="Resultado" value={resultadoFiltro} onChange={(v) => { setResultadoFiltro(v as typeof resultadoFiltro); setPage(1); }}
                options={[{value:'todos',label:'Todos'},{value:'enviado',label:'Enviado'},{value:'promesa_pago',label:'Promesa'},{value:'no_contesta',label:'No contesta'},{value:'rechazado',label:'Rechazado'}]} />
              <FilterSelect label="Calif."    value={califFiltro}     onChange={(v) => { setCalifFiltro(v as typeof califFiltro); setPage(1); }}
                options={[{value:'todos',label:'Todos'},...(['A','B','C','D','E'] as Calificacion[]).map(k => ({value:k,label:k}))]} />
              <FilterSelect label="Jurídico"  value={jurFiltro}       onChange={(v) => { setJurFiltro(v as typeof jurFiltro); setPage(1); }}
                options={[{value:'todos',label:'Todos'},...(Object.entries(JUR_BADGE).map(([k,v]) => ({value:k,label:v.label})))]} />
              <FilterSelect label="Fecha"     value={fechaFiltro}     onChange={(v) => { setFechaFiltro(v as typeof fechaFiltro); setPage(1); }}
                options={[{value:'todos',label:'Todos'},{value:'hoy',label:'Hoy'},{value:'semana',label:'Últ. 7 días'},{value:'mes',label:'Últ. 30 días'}]} />
              <button onClick={handleLimpiar} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-dark border border-slate-200 bg-white rounded-xl px-3 py-2 hover:border-slate-300 transition-colors">
                <Filter size={14} /> Limpiar
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/50 uppercase tracking-widest text-[9px] font-bold text-slate-400">
                  <th className="px-5 py-3">Cliente / Crédito</th>
                  <th className="px-5 py-3">Canal</th>
                  <th className="px-5 py-3">Resultado</th>
                  <th className="px-5 py-3">Calif.</th>
                  <th className="px-5 py-3 text-right">Mora</th>
                  <th className="px-5 py-3">Jurídico</th>
                  <th className="px-5 py-3">Origen</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-16">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <Loader2 size={24} className="animate-spin" />
                      <p className="text-xs font-medium">Cargando gestiones...</p>
                    </div>
                  </td></tr>
                ) : error ? (
                  <tr><td colSpan={9} className="text-center py-16">
                    <div className="inline-flex flex-col items-center gap-3 text-center">
                      <AlertCircle size={24} className="text-red-500" />
                      <p className="text-xs font-bold text-navy-dark">No se pudieron cargar las gestiones</p>
                      <p className="text-[11px] text-slate-500">{error}</p>
                      <button onClick={() => void loadTodas()} className="btn-primary flex items-center gap-2 text-xs">
                        <RefreshCw size={12} /> Reintentar
                      </button>
                    </div>
                  </td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-400 text-sm font-medium">
                    No hay gestiones que coincidan con los filtros.
                  </td></tr>
                ) : (
                  items.map((g) => {
                    const cb = CANAL_META[g.canal];
                    const rb = RESULTADO_BADGE[g.resultado];
                    const jb = JUR_BADGE[g.estadoJuridico];
                    return (
                      <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-xs font-bold text-navy-dark">{g.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{formatGestionId(g.id)} · {g.numeroCredito}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold', cb.bg, cb.text)}>
                            <cb.Icon size={10} /> {cb.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={clsx('px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest', rb.bg, rb.text)}>
                            {rb.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={clsx('inline-flex w-6 h-6 items-center justify-center rounded-md text-[10px] font-extrabold', CALIF_BADGE[g.calificacion])}>
                            {g.calificacion}
                          </span>
                        </td>
                        <td className={clsx('px-5 py-3 text-right text-xs font-bold',
                          g.diasMora === 0 ? 'text-emerald-600' :
                          g.diasMora <= 30 ? 'text-amber-600' :
                          g.diasMora <= 90 ? 'text-orange-600' : 'text-red-600',
                        )}>
                          {g.diasMora === 0 ? '—' : `${g.diasMora}d`}
                        </td>
                        <td className="px-5 py-3">
                          <span className={clsx('px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest', jb.bg, jb.text)}>
                            {jb.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <OrigenBadge origen={g.origen} />
                        </td>
                        <td className="px-5 py-3 text-[11px] text-slate-600 font-medium">
                          {formatFecha(g.fecha)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => setSelectedId(g.id)} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#006875] hover:bg-[#006875]/10 px-3 py-1.5 rounded-lg transition-colors">
                            <Eye size={13} /> Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <p>
              Mostrando <span className="font-bold text-navy-dark">{items.length}</span> de{' '}
              <span className="font-bold text-navy-dark">{totalItems}</span> gestiones
            </p>
            <div className="flex items-center gap-1">
              <PagerBtn disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft size={14} />
              </PagerBtn>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={clsx('w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  n === safePage ? 'bg-[#006875] text-white' : 'text-slate-500 hover:bg-slate-100')}>
                  {n}
                </button>
              ))}
              <PagerBtn disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight size={14} />
              </PagerBtn>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'promesas' && (
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <SubTab active={subPromesas === 'proximas'}  onClick={() => setSubPromesas('proximas')}  label="Próximas a vencer" />
            <SubTab active={subPromesas === 'vencidas'}  onClick={() => setSubPromesas('vencidas')}  label="Vencidas sin pago" />
            <SubTab active={subPromesas === 'cumplidas'} onClick={() => setSubPromesas('cumplidas')} label="Cumplidas" />
          </div>
          {promesasLoading ? (
            <div className="glass-card rounded-3xl py-16 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <PromesasTable
              gestiones={promesas}
              tipo={subPromesas}
              onVer={(g) => setSelectedId(g.id)}
            />
          )}
        </div>
      )}

      {activeTab === 'juridica' && (
        juridicaLoading ? (
          <div className="glass-card rounded-3xl py-16 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <JuridicaTable gestiones={juridica} onVer={(g) => setSelectedId(g.id)} />
        )
      )}

      {selectedId !== null && (
        <GestionDrawer id={selectedId} onClose={() => setSelectedId(null)} />
      )}

      {showNueva && (
        <NuevaGestionModal
          onClose={() => setShowNueva(false)}
          onCreated={() => { setShowNueva(false); void loadTodas(); }}
        />
      )}
    </div>
  );
}

// ── KPI / Tab / Filter / Pager ───────────────────────────
interface KpiCardProps {
  title: string; value: string; sub: string;
  Icon: typeof Sparkles;
  color: 'blue' | 'indigo' | 'purple' | 'emerald';
}
function KpiCard({ title, value, sub, Icon, color }: KpiCardProps) {
  const map: Record<string, { icon: string; value: string }> = {
    blue:    { icon: 'bg-blue-50 text-blue-500',       value: 'text-blue-600' },
    indigo:  { icon: 'bg-indigo-50 text-indigo-500',   value: 'text-indigo-600' },
    purple:  { icon: 'bg-purple-50 text-purple-500',   value: 'text-purple-600' },
    emerald: { icon: 'bg-emerald-50 text-emerald-500', value: 'text-emerald-600' },
  };
  const c = map[color] ?? map.blue;
  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110', c.icon)}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-none mb-2">{title}</p>
      <p className={clsx('text-2xl font-bold tracking-tight mb-1', c.value)}>{value}</p>
      <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function Tab({ active, onClick, Icon, label }: {
  active: boolean; onClick: () => void; Icon: typeof MessageSquare; label: string;
}) {
  return (
    <button onClick={onClick} className={clsx('flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
      active ? 'bg-white text-navy-dark shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
      <Icon size={14} /> {label}
    </button>
  );
}

function SubTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={clsx('px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
      active ? 'bg-white text-navy-dark shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
      {label}
    </button>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 focus-within:ring-2 focus-within:ring-[#00e5ff]/20">
      <span className="text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-navy-dark font-bold text-xs focus:outline-none cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function PagerBtn({ disabled, onClick, children }: {
  disabled: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button disabled={disabled} onClick={onClick} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
      {children}
    </button>
  );
}

function OrigenBadge({ origen }: { origen: OrigenGestion }) {
  const Icon = origen === 'Automatizada' ? Bot : UserIcon;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[10px] font-bold',
      origen === 'Automatizada' ? 'text-indigo-600' : 'text-slate-600')}>
      <Icon size={11} /> {origen}
    </span>
  );
}

// ── Tab 2: Promesas ──────────────────────────────────────
function PromesasTable({
  gestiones, tipo, onVer,
}: {
  gestiones: Gestion[]; tipo: EstadoPromesa; onVer: (g: Gestion) => void;
}) {
  if (gestiones.length === 0) {
    return (
      <div className="glass-card rounded-3xl py-16 text-center text-sm font-medium text-slate-400">
        No hay promesas en esta categoría.
      </div>
    );
  }
  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 uppercase tracking-widest text-[9px] font-bold text-slate-400">
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3 text-right">Valor prometido</th>
              <th className="px-5 py-3">Fecha promesa</th>
              <th className="px-5 py-3">¿Pagó?</th>
              <th className="px-5 py-3 text-right">Saldo adeudado</th>
              <th className="px-5 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {gestiones.map((g) => (
              <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-xs font-bold text-navy-dark">{g.nombre}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{g.numeroCredito}</p>
                </td>
                <td className="px-5 py-3 text-right text-xs font-bold text-emerald-600">
                  {g.valorPrometido ? formatCOP(g.valorPrometido) : '—'}
                </td>
                <td className="px-5 py-3">
                  <p className="text-[11px] font-bold text-navy-dark">{formatFecha(g.fechaPromesa)}</p>
                  {g.fechaPromesa && (
                    <p className={clsx('text-[10px] font-medium',
                      tipo === 'vencidas' ? 'text-red-600' :
                      tipo === 'cumplidas' ? 'text-emerald-600' : 'text-amber-600',
                    )}>
                      {tipo === 'vencidas' ? `Vencida hace ${-diasHastaFecha(g.fechaPromesa)} días` :
                       tipo === 'cumplidas' ? 'Cumplida' :
                       `En ${diasHastaFecha(g.fechaPromesa)} días`}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3">
                  {tipo === 'cumplidas' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle2 size={11} /> Pagado
                    </span>
                  ) : tipo === 'vencidas' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600">
                      <AlertCircle size={11} /> No pagado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Clock size={11} /> Pendiente
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right text-xs font-bold text-navy-dark">
                  {g.saldoTotal ? formatCOP(g.saldoTotal) : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => onVer(g)} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#006875] hover:bg-[#006875]/10 px-3 py-1.5 rounded-lg transition-colors">
                    <Eye size={13} /> Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 3: Jurídica ──────────────────────────────────────
function JuridicaTable({ gestiones, onVer }: {
  gestiones: Gestion[]; onVer: (g: Gestion) => void;
}) {
  if (gestiones.length === 0) {
    return (
      <div className="glass-card rounded-3xl py-16 text-center text-sm font-medium text-slate-400">
        No hay créditos en proceso jurídico.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 bg-red-50/40 border border-red-100 rounded-2xl px-4 py-3">
        <ShieldAlert className="text-red-500" size={18} />
        <p className="text-xs text-slate-700 font-medium">
          {gestiones.length} créditos con estado jurídico activo. Requieren seguimiento prioritario.
        </p>
      </div>
      <div className="space-y-2">
        {gestiones.map((g) => {
          const alerta = JUR_ALERTA[g.estadoJuridico];
          const jb = JUR_BADGE[g.estadoJuridico];
          return (
            <div
              key={g.id}
              className={clsx(
                'glass-card rounded-2xl p-5 border-l-4 flex flex-col md:flex-row md:items-center gap-4',
                alerta?.borderColor ?? 'border-l-slate-200',
                alerta?.bgRow,
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm font-bold text-navy-dark">{g.nombre}</p>
                  <span className={clsx('px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest', jb.bg, jb.text)}>
                    {jb.label}
                  </span>
                  <span className={clsx('inline-flex w-6 h-6 items-center justify-center rounded-md text-[10px] font-extrabold', CALIF_BADGE[g.calificacion])}>
                    {g.calificacion}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {g.numeroCredito} · {g.diasMora}d mora · saldo {formatCOP(g.saldoTotal ?? 0)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Abogado</p>
                  <p className="text-xs font-bold text-navy-dark">{g.abogadoAsignado ?? '—'}</p>
                </div>
                <button onClick={() => onVer(g)} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#006875] hover:bg-[#006875]/10 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                  <Eye size={13} /> Ver detalle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Drawer ───────────────────────────────────────────────
function GestionDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const [gestion, setGestion] = useState<Gestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getGestion(id)
      .then(setGestion)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-navy-dark/40 backdrop-blur-sm"
      onClick={onClose} role="dialog" aria-modal="true"
    >
      <aside className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00b4d8] to-[#00e5ff] text-navy-dark font-bold flex items-center justify-center shrink-0 text-sm">
              {gestion ? initials(gestion.nombre) : '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-dark leading-tight">{gestion?.nombre ?? 'Cargando...'}</h3>
              <p className="text-xs text-slate-400 font-medium">{formatGestionId(id)}{gestion ? ` · ${gestion.numeroCredito}` : ''}</p>
              {gestion && (
                <span className={clsx('inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest',
                  RESULTADO_BADGE[gestion.resultado].bg, RESULTADO_BADGE[gestion.resultado].text)}>
                  {RESULTADO_BADGE[gestion.resultado].label}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-navy-dark p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : error || !gestion ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <AlertCircle size={28} className="text-red-500" />
            <p className="text-xs text-slate-500">{error ?? 'No se pudo cargar la gestión.'}</p>
          </div>
        ) : (
          <DrawerBody gestion={gestion} />
        )}
      </aside>
    </div>
  );
}

function DrawerBody({ gestion }: { gestion: Gestion }) {
  const cb = CANAL_META[gestion.canal];
  const rb = RESULTADO_BADGE[gestion.resultado];
  const jb = JUR_BADGE[gestion.estadoJuridico];
  const historial = gestion.historial ?? [];

  return (
    <div className="p-6 space-y-6">
      <Section title="Información del cliente">
        <InfoRow Icon={UserIcon} label="Nombre" value={gestion.nombre} />
        <InfoRow Icon={DollarSign} label="Ingresos mensuales" value={gestion.ingresosMensuales > 0 ? formatCOP(gestion.ingresosMensuales) : 'No reportados'} />
      </Section>

      <Section title="Estado de la cartera">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="Calificación" value={gestion.calificacion} valueClass="text-navy-dark" />
          <Stat label="Días mora"    value={gestion.diasMora === 0 ? 'Sin mora' : `${gestion.diasMora}d`}
                valueClass={gestion.diasMora === 0 ? 'text-emerald-600' : gestion.diasMora <= 30 ? 'text-amber-600' : gestion.diasMora <= 90 ? 'text-orange-600' : 'text-red-600'} />
          {typeof gestion.saldoTotal === 'number' && (
            <Stat label="Saldo total" value={formatCOP(gestion.saldoTotal)} valueClass="text-navy-dark" />
          )}
          <div className="rounded-2xl border border-slate-100 px-4 py-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Estado jurídico</p>
            <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest', jb.bg, jb.text)}>
              {jb.label}
            </span>
          </div>
        </div>
        {gestion.abogadoAsignado && (
          <InfoRow Icon={Gavel} label="Abogado asignado" value={gestion.abogadoAsignado} />
        )}
      </Section>

      <Section title="Detalle de la gestión">
        <div className="rounded-2xl border border-slate-100 p-4 space-y-3">
          <KV label="Canal">
            <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold', cb.bg, cb.text)}>
              <cb.Icon size={10} /> {cb.label}
            </span>
          </KV>
          <KV label="Resultado">
            <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest', rb.bg, rb.text)}>
              {rb.label}
            </span>
          </KV>
          <KV label="Origen"><OrigenBadge origen={gestion.origen} /></KV>
          {gestion.estrategiaAsociada && (
            <KV label="Estrategia">
              <span className="text-[11px] font-bold text-indigo-600">{gestion.estrategiaAsociada}</span>
            </KV>
          )}
          <KV label="Fecha">
            <span className="text-[11px] font-bold text-navy-dark">{formatFecha(gestion.fecha)}</span>
          </KV>
        </div>

        {gestion.resultado === 'promesa_pago' && gestion.valorPrometido && (
          <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest leading-none">Promesa de pago</p>
              <p className="text-xs font-bold text-navy-dark">{formatCOP(gestion.valorPrometido)} · {formatFecha(gestion.fechaPromesa)}</p>
            </div>
          </div>
        )}

        {gestion.notas && (
          <div className="mt-3 rounded-2xl bg-slate-50/70 border border-slate-100 p-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Notas</p>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{gestion.notas}</p>
          </div>
        )}
      </Section>

      <Section title={`Historial del crédito (${historial.length})`}>
        {historial.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium italic">Sin gestiones anteriores en este crédito.</p>
        ) : (
          <ul className="space-y-3">
            {historial.map((h) => {
              const hcb = CANAL_META[h.canal];
              const hrb = RESULTADO_BADGE[h.resultado];
              return (
                <li key={h.id} className="rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <Calendar size={11} /> {formatFecha(h.fecha)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={clsx('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold', hcb.bg, hcb.text)}>
                        <hcb.Icon size={9} /> {hcb.label}
                      </span>
                      <span className={clsx('px-1.5 py-0.5 rounded-md text-[9px] font-bold', hrb.bg, hrb.text)}>
                        {hrb.label}
                      </span>
                    </div>
                  </div>
                  {h.notas && <p className="text-[11px] text-slate-600 leading-relaxed">{h.notas}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

// ── Modal Nueva Gestión ──────────────────────────────────
function NuevaGestionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [busqueda, setBusqueda] = useState('');
  const [canal, setCanal] = useState<CanalGestion>('whatsapp');
  const [resultado, setResultado] = useState<ResultadoGestion>('enviado');
  const [valorPrometido, setValorPrometido] = useState('');
  const [fechaPromesa, setFechaPromesa] = useState('');
  const [notas, setNotas] = useState('');
  const [sugerencias, setSugerencias] = useState<Gestion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clienteSel, setClienteSel] = useState<Gestion | null>(null);

  // Búsqueda en backend con debounce
  useEffect(() => {
    if (!busqueda.trim() || clienteSel) {
      setSugerencias([]);
      return;
    }
    const t = setTimeout(() => {
      setBuscando(true);
      listGestiones({ search: busqueda.trim(), limit: 5 })
        .then(({ items }) => {
          // De-duplica por idCredito.
          const seen = new Set<string>();
          const out: Gestion[] = [];
          for (const g of items) {
            if (seen.has(g.idCredito)) continue;
            seen.add(g.idCredito);
            out.push(g);
          }
          setSugerencias(out);
        })
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => setBuscando(false));
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda, clienteSel]);

  const handleCrear = async () => {
    if (!clienteSel) return;
    setCreando(true);
    setError(null);
    try {
      await crearGestion({
        id_credito: clienteSel.idCredito,
        canal,
        resultado,
        valor_promesa: resultado === 'promesa_pago' ? Number(valorPrometido) : null,
        fecha_promesa: resultado === 'promesa_pago' ? fechaPromesa : null,
        notas: notas || null,
      });
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCreando(false);
    }
  };

  const puedeCrear =
    clienteSel !== null &&
    (resultado !== 'promesa_pago' ||
      (Number(valorPrometido) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(fechaPromesa)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/40 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#006875] text-white flex items-center justify-center shrink-0">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-dark leading-tight">Nueva gestión</h3>
              <p className="text-xs text-slate-500 font-medium">Registrar un contacto con un cliente</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-navy-dark p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </header>

        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs font-medium">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cliente / Crédito</label>
            {clienteSel ? (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-navy-dark">{clienteSel.nombre}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{clienteSel.numeroCredito}</p>
                  </div>
                </div>
                <button onClick={() => { setClienteSel(null); setBusqueda(''); }} className="text-slate-400 hover:text-navy-dark">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o número de crédito..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20"
                />
                {buscando && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                )}
                {sugerencias.length > 0 && (
                  <ul className="mt-2 border border-slate-100 rounded-xl divide-y divide-slate-50 bg-white shadow-md max-h-48 overflow-y-auto">
                    {sugerencias.map((s) => (
                      <li key={s.idCredito}>
                        <button onClick={() => { setClienteSel(s); setBusqueda(''); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors">
                          <p className="text-xs font-bold text-navy-dark">{s.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{s.numeroCredito}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldSelect label="Canal" value={canal} onChange={(v) => setCanal(v as CanalGestion)}
              options={[{value:'whatsapp',label:'WhatsApp'},{value:'llamada',label:'Llamada'},{value:'email',label:'Email'},{value:'sms',label:'SMS'}]} />
            <FieldSelect label="Resultado" value={resultado} onChange={(v) => setResultado(v as ResultadoGestion)}
              options={[{value:'enviado',label:'Enviado'},{value:'promesa_pago',label:'Promesa de pago'},{value:'no_contesta',label:'No contesta'},{value:'rechazado',label:'Rechazado'}]} />
          </div>

          {resultado === 'promesa_pago' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Valor prometido (COP)</label>
                <input type="number" value={valorPrometido} onChange={(e) => setValorPrometido(e.target.value)}
                  placeholder="0" min={0}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Fecha promesa</label>
                <input type="date" value={fechaPromesa} onChange={(e) => setFechaPromesa(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notas</label>
            <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalle del contacto, acuerdos, próximos pasos..."
              className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 resize-none" />
          </div>
        </div>

        <footer className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} disabled={creando} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            disabled={!puedeCrear || creando}
            onClick={() => void handleCrear()}
            className="flex items-center gap-2 bg-[#006875] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#004f58] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {creando ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {creando ? 'Registrando...' : 'Registrar gestión'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Mini utilidades drawer ──────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</h4>
      {children}
    </section>
  );
}

function InfoRow({ Icon, label, value }: { Icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{label}</p>
        <p className="text-xs font-bold text-navy-dark truncate">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 px-4 py-3">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className={clsx('text-base font-extrabold', valueClass)}>{value}</p>
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</span>
      {children}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + second).toUpperCase() || '?';
}
