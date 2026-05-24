import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  Megaphone, Wand2, User as UserIcon, ToggleRight, ToggleLeft,
  Eye, X, Loader2, AlertCircle, RefreshCw,
  Layers, Target, MessageSquare, Phone, Mail,
  Send, Calendar, CheckCircle2, XCircle, Clock, Play, FileText,
  Filter, Search,
} from 'lucide-react';
import {
  listCampanas,
  getCampanaDetalle,
  toggleCampana,
} from '../services/campanas';
import { getApiErrorMessage } from '../services/api';
import type {
  CampanaListItem,
  CampanaDetalle,
  CanalAccion,
  EstadoEjecucion,
} from '../data/campanasMock';
import type { AutomatizacionEstado } from '../types/api';

// ── Helpers ──────────────────────────────────────────────
const formatCOPCompact = (v: number) => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)} MM`;
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)} M`;
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)} K`;
  return `$${v}`;
};
const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const formatFecha = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ESTADO_BADGE: Record<AutomatizacionEstado, { bg: string; text: string; label: string }> = {
  ACTIVA:     { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Activa' },
  PAUSADA:    { bg: 'bg-slate-100',  text: 'text-slate-500',   label: 'Pausada' },
  BORRADOR:   { bg: 'bg-amber-50',   text: 'text-amber-600',   label: 'Borrador' },
  COMPLETADA: { bg: 'bg-blue-50',    text: 'text-blue-600',    label: 'Completada' },
};

const EJECUCION_BADGE: Record<EstadoEjecucion, { bg: string; text: string; Icon: typeof CheckCircle2 }> = {
  PENDIENTE:  { bg: 'bg-slate-100',  text: 'text-slate-500',   Icon: Clock },
  EJECUTANDO: { bg: 'bg-amber-50',   text: 'text-amber-600',   Icon: Play },
  COMPLETADA: { bg: 'bg-emerald-50', text: 'text-emerald-600', Icon: CheckCircle2 },
  ERROR:      { bg: 'bg-red-50',     text: 'text-red-600',     Icon: XCircle },
};

const CANAL_META: Record<CanalAccion, { bg: string; text: string; Icon: typeof MessageSquare; label: string }> = {
  whatsapp: { bg: 'bg-emerald-50', text: 'text-emerald-600', Icon: MessageSquare, label: 'WhatsApp' },
  llamada:  { bg: 'bg-blue-50',    text: 'text-blue-600',    Icon: Phone,         label: 'Llamada' },
  email:    { bg: 'bg-indigo-50',  text: 'text-indigo-600',  Icon: Mail,          label: 'Email' },
  sms:      { bg: 'bg-cyan-50',    text: 'text-cyan-600',    Icon: Send,          label: 'SMS' },
};

const TIPO_CREDITO_LABEL: Record<string, string> = {
  CONSUMO:         'Consumo',
  LIBRE_INVERSION: 'Libre inversión',
  MICROCREDITO:    'Microcrédito',
  VEHICULO:        'Vehículo',
  HIPOTECARIO:     'Hipotecario',
  TARJETA_CREDITO: 'Tarjeta',
};

const ESTADO_JURIDICO_LABEL: Record<string, string> = {
  SIN_PROCESO:  'Sin proceso',
  PREJURIDICO:  'Prejurídico',
  JURIDICO:     'Jurídico',
  ACUERDO_PAGO: 'Acuerdo de pago',
  SENTENCIA:    'Sentencia',
  EMBARGO:      'Embargo',
};

const isIA = (creadaPor: string | null | undefined) =>
  (creadaPor ?? '').toLowerCase() === 'ia';

function disparadorLabel(seg: CampanaListItem['segmento_config']): string {
  const parts: string[] = [];
  if (typeof seg?.dias_mora_min === 'number') parts.push(`mora ≥ ${seg.dias_mora_min}d`);
  if (typeof seg?.saldo_min === 'number')     parts.push(`saldo ≥ ${formatCOPCompact(seg.saldo_min)}`);
  return parts.join(' · ');
}

// ── Componente principal ─────────────────────────────────
export function Campanas() {
  const [items, setItems] = useState<CampanaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | AutomatizacionEstado>('todos');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listCampanas());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (estadoFiltro !== 'todos' && c.estado !== estadoFiltro) return false;
      if (q && !c.nombre.toLowerCase().includes(q) && !c.descripcion.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, estadoFiltro]);

  // KPIs derivados del listado
  const kpis = useMemo(() => {
    const total = items.length;
    // Aproximación de tasa de contacto: % de campañas con última ejecución exitosa
    // (COMPLETADA) sobre las que han tenido ejecuciones. El cálculo real
    // requiere endpoint adicional cruzando gestiones + estrategias.
    const ejecutadas = items.filter((c) => c.ultimo_estado !== null);
    const exitosas = ejecutadas.filter((c) => c.ultimo_estado === 'COMPLETADA').length;
    const tasaContacto = ejecutadas.length === 0 ? 0 : (exitosas / ejecutadas.length) * 100;
    return { total, tasaContacto };
  }, [items]);

  const onToggle = async (c: CampanaListItem) => {
    setBusyId(c.id);
    try {
      const updated = await toggleCampana(c.id);
      setItems((prev) => prev.map((it) => (it.id === c.id ? { ...it, estado: updated.estado } : it)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-navy-dark">Campañas</h2>
            <Megaphone className="text-[#006875] w-5 h-5" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Estrategias de contacto automatizadas generadas por IA o configuradas por gestores.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard title="Campañas totales" value={String(kpis.total)}                 Icon={Layers} color="indigo" />
        <KpiCard title="Tasa de contacto" value={`${kpis.tasaContacto.toFixed(0)}%`} Icon={Target} color="blue" />
      </div>

      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar campaña..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Estado"
              value={estadoFiltro}
              onChange={(v) => setEstadoFiltro(v as typeof estadoFiltro)}
              options={[
                { value: 'todos',      label: 'Todos' },
                { value: 'ACTIVA',     label: 'Activa' },
                { value: 'PAUSADA',    label: 'Pausada' },
                { value: 'BORRADOR',   label: 'Borrador' },
                { value: 'COMPLETADA', label: 'Completada' },
              ]}
            />
            <button
              onClick={() => { setSearch(''); setEstadoFiltro('todos'); }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-dark border border-slate-200 bg-white rounded-xl px-3 py-2 hover:border-slate-300 transition-colors"
            >
              <Filter size={14} /> Limpiar
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/50 uppercase tracking-widest text-[9px] font-bold text-slate-400">
                <th className="px-5 py-3">Campaña</th>
                <th className="px-5 py-3">Descripción</th>
                <th className="px-5 py-3">Segmento</th>
                <th className="px-5 py-3">Creada por</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Ejecuciones</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 size={24} className="animate-spin" />
                    <p className="text-xs font-medium">Cargando campañas...</p>
                  </div>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="inline-flex flex-col items-center gap-3 text-center">
                    <AlertCircle size={24} className="text-red-500" />
                    <p className="text-xs font-bold text-navy-dark">No se pudieron cargar las campañas</p>
                    <p className="text-[11px] text-slate-500">{error}</p>
                    <button onClick={() => void load()} className="btn-primary flex items-center gap-2 text-xs">
                      <RefreshCw size={12} /> Reintentar
                    </button>
                  </div>
                </td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 text-sm font-medium">
                  No hay campañas que coincidan.
                </td></tr>
              ) : (
                filtradas.map((c) => {
                  const eb = ESTADO_BADGE[c.estado];
                  const isActive = c.estado === 'ACTIVA';
                  const dispar = disparadorLabel(c.segmento_config);
                  const busy = busyId === c.id;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 max-w-[260px]">
                        <p className="text-xs font-bold text-navy-dark leading-tight">{c.nombre}</p>
                        {dispar && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{dispar}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 max-w-[280px]">
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{c.descripcion}</p>
                      </td>
                      <td className="px-5 py-3 max-w-[220px]">
                        <SegmentoBadges seg={c.segmento_config} />
                      </td>
                      <td className="px-5 py-3">
                        <OrigenBadge creadaPor={c.creada_por} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={clsx('px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest', eb.bg, eb.text)}>
                            {eb.label}
                          </span>
                          {isActive && (
                            <button
                              onClick={() => void onToggle(c)}
                              disabled={busy}
                              title="Pausar"
                              className="disabled:opacity-40"
                            >
                              {busy
                                ? <Loader2 size={20} className="animate-spin text-slate-400" />
                                : <ToggleRight size={24} className="text-emerald-500" />}
                            </button>
                          )}
                          {c.estado === 'PAUSADA' && (
                            <button
                              onClick={() => void onToggle(c)}
                              disabled={busy}
                              title="Activar"
                              className="disabled:opacity-40"
                            >
                              {busy
                                ? <Loader2 size={20} className="animate-spin text-slate-400" />
                                : <ToggleLeft size={24} className="text-slate-300" />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs font-bold text-navy-dark">{c.total_acciones}</span>
                        <span className="text-[10px] text-slate-400 ml-1">pasos</span>
                        {c.ultima_ejecucion && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            últ. {formatFecha(c.ultima_ejecucion)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelectedId(c.id)}
                          title="Ver detalle"
                          className="p-2 rounded-lg text-slate-400 hover:text-[#006875] hover:bg-[#006875]/10 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] font-medium text-slate-400">
          Mostrando <span className="font-bold text-navy-dark">{filtradas.length}</span> de{' '}
          <span className="font-bold text-navy-dark">{items.length}</span> campañas
        </p>
      </div>

      {selectedId !== null && (
        <CampanaDrawer id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

// ── Subcomponentes ───────────────────────────────────────
interface KpiCardProps {
  title: string; value: string;
  Icon: typeof Layers;
  color: 'blue' | 'indigo' | 'purple' | 'emerald';
}
function KpiCard({ title, value, Icon, color }: KpiCardProps) {
  const map: Record<string, { icon: string; value: string }> = {
    blue:    { icon: 'bg-blue-50 text-blue-500',       value: 'text-blue-600' },
    indigo:  { icon: 'bg-indigo-50 text-indigo-500',   value: 'text-indigo-600' },
    purple:  { icon: 'bg-purple-50 text-purple-500',   value: 'text-purple-600' },
    emerald: { icon: 'bg-emerald-50 text-emerald-500', value: 'text-emerald-600' },
  };
  const c = map[color] ?? map.blue;
  return (
    <div className="glass-card rounded-3xl p-6 flex items-center gap-5 group">
      <div className={clsx('p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110', c.icon)}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-none mb-2">{title}</p>
        <p className={clsx('text-2xl font-bold tracking-tight', c.value)}>{value}</p>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 focus-within:ring-2 focus-within:ring-[#00e5ff]/20">
      <span className="text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-navy-dark font-bold text-xs focus:outline-none cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function OrigenBadge({ creadaPor }: { creadaPor: string | null | undefined }) {
  if (isIA(creadaPor)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
        <Wand2 size={10} /> IA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
      <UserIcon size={10} /> Usuario
    </span>
  );
}

function SegmentoBadges({ seg }: { seg: CampanaListItem['segmento_config'] | null }) {
  if (!seg) return <span className="text-[10px] text-slate-400 italic">Sin segmento</span>;
  const badges: { label: string; cls: string }[] = [];
  if (seg.calificaciones?.length) {
    for (const k of seg.calificaciones) {
      badges.push({ label: k, cls: 'bg-amber-50 text-amber-700' });
    }
  }
  if (seg.tipo_credito?.length) {
    for (const t of seg.tipo_credito) {
      badges.push({ label: TIPO_CREDITO_LABEL[t] ?? t, cls: 'bg-indigo-50 text-indigo-600' });
    }
  }
  if (typeof seg.dias_mora_min === 'number') {
    badges.push({ label: `≥ ${seg.dias_mora_min}d`, cls: 'bg-red-50 text-red-600' });
  }
  if (badges.length === 0) {
    return <span className="text-[10px] text-slate-400 italic">Sin segmento</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b, i) => (
        <span key={i} className={clsx('px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest', b.cls)}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

// ── Drawer ───────────────────────────────────────────────
function CampanaDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const [data, setData] = useState<CampanaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCampanaDetalle(id)
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const e = data?.estrategia;
  const eb = e ? ESTADO_BADGE[e.estado] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-navy-dark/40 backdrop-blur-sm"
      onClick={onClose} role="dialog" aria-modal="true"
    >
      <aside className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col" onClick={(ev) => ev.stopPropagation()}>
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shrink-0">
              <Megaphone size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-dark leading-tight">
                {e?.nombre ?? 'Cargando...'}
              </h3>
              {e && (
                <div className="flex items-center gap-2 mt-1">
                  {eb && (
                    <span className={clsx('px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest', eb.bg, eb.text)}>
                      {eb.label}
                    </span>
                  )}
                  <OrigenBadge creadaPor={e.creada_por} />
                </div>
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
        ) : error || !data ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <AlertCircle size={28} className="text-red-500" />
            <p className="text-xs text-slate-500">{error ?? 'No se pudo cargar el detalle.'}</p>
          </div>
        ) : (
          <DrawerBody data={data} />
        )}
      </aside>
    </div>
  );
}

function DrawerBody({ data }: { data: CampanaDetalle }) {
  const { estrategia, acciones, ejecuciones } = data;

  return (
    <div className="p-6 space-y-6">
      <Section title="Información general">
        {estrategia.descripcion && (
          <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">{estrategia.descripcion}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="Creada por" value={isIA(estrategia.creada_por) ? 'Asistente IA' : 'Usuario'} />
          <InfoBox label="Creada el" value={formatFecha(estrategia.created_at)} />
        </div>
      </Section>

      <Section title="Segmento objetivo">
        <SegmentoDetalle seg={estrategia.segmento_config} />
      </Section>

      <Section title={`Flujo de acciones (${acciones.length})`}>
        {acciones.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium italic">Aún no hay acciones configuradas.</p>
        ) : (
          <ol className="relative space-y-3 ml-2">
            <span className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200" aria-hidden />
            {acciones.map((a) => {
              const meta = CANAL_META[a.tipo];
              return (
                <li key={a.id} className="relative pl-10">
                  <div className={clsx('absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center', meta?.bg ?? 'bg-slate-100', meta?.text ?? 'text-slate-500')}>
                    {meta?.Icon ? <meta.Icon size={14} /> : <FileText size={14} />}
                  </div>
                  <div className="rounded-2xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-navy-dark">
                        Paso {a.orden} · {meta?.label ?? a.tipo}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <Clock size={10} /> espera {a.espera_horas}h
                      </span>
                    </div>
                    {a.config && Object.keys(a.config).length > 0 && (
                      <pre className="text-[10px] text-slate-500 bg-slate-50/70 rounded-lg p-2 overflow-x-auto leading-snug">
{JSON.stringify(a.config, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      <Section title={`Automatizaciones vinculadas (${ejecuciones.length})`}>
        {ejecuciones.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium italic">Aún no hay ejecuciones registradas.</p>
        ) : (
          <ul className="space-y-2">
            {ejecuciones.map((e) => {
              const meta = EJECUCION_BADGE[e.estado];
              const enviados = e.resultado?.enviados ?? 0;
              const errores = e.resultado?.errores ?? 0;
              return (
                <li key={e.id} className="rounded-2xl border border-slate-100 p-3 flex items-center gap-3">
                  <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', meta.bg, meta.text)}>
                    <meta.Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={clsx('px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest', meta.bg, meta.text)}>
                        {e.estado}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Calendar size={10} /> {formatFecha(e.created_at)}
                      </span>
                    </div>
                    {e.resultado && (
                      <p className="text-[11px] text-slate-600 font-medium mt-1">
                        <span className="text-emerald-600 font-bold">{enviados.toLocaleString('es-CO')}</span> enviados
                        {' · '}
                        <span className={clsx('font-bold', errores > 0 ? 'text-red-600' : 'text-slate-400')}>
                          {errores.toLocaleString('es-CO')}
                        </span> errores
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function SegmentoDetalle({ seg }: { seg: CampanaListItem['segmento_config'] | null }) {
  if (!seg) {
    return <p className="text-xs text-slate-400 italic">Sin segmento configurado.</p>;
  }
  const filas: { label: string; valor: React.ReactNode }[] = [];

  if (seg.calificaciones?.length) {
    filas.push({
      label: 'Calificaciones target',
      valor: (
        <div className="flex gap-1">
          {seg.calificaciones.map((k) => (
            <span key={k} className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold">{k}</span>
          ))}
        </div>
      ),
    });
  }
  if (typeof seg.dias_mora_min === 'number') {
    filas.push({ label: 'Días mora mínimo', valor: <span className="text-xs font-bold text-red-600">{seg.dias_mora_min} días</span> });
  }
  if (typeof seg.saldo_min === 'number') {
    filas.push({ label: 'Saldo mínimo', valor: <span className="text-xs font-bold text-navy-dark">{formatCOP(seg.saldo_min)}</span> });
  }
  if (seg.tipo_credito?.length) {
    filas.push({
      label: 'Tipo de crédito',
      valor: (
        <div className="flex flex-wrap gap-1">
          {seg.tipo_credito.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold">
              {TIPO_CREDITO_LABEL[t] ?? t}
            </span>
          ))}
        </div>
      ),
    });
  }
  if (seg.estado_juridico?.length) {
    filas.push({
      label: 'Estado jurídico',
      valor: (
        <div className="flex flex-wrap gap-1">
          {seg.estado_juridico.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[10px] font-bold">
              {ESTADO_JURIDICO_LABEL[s] ?? s}
            </span>
          ))}
        </div>
      ),
    });
  }

  if (filas.length === 0) {
    return <p className="text-xs text-slate-400 italic">Sin filtros activos.</p>;
  }

  return (
    <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-50">
      {filas.map((f, i) => (
        <li key={i} className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{f.label}</span>
          {f.valor}
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</h4>
      {children}
    </section>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 px-4 py-3">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-navy-dark">{value}</p>
    </div>
  );
}
