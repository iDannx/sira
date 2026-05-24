import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  Search, Filter, FileText, X, Phone, Mail, Calendar, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Clock, DollarSign, ArrowUpDown, ArrowUp, ArrowDown,
  Wallet, TrendingUp, TrendingDown, BarChart3, Eye, Plus, XCircle,
  User as UserIcon, Loader2, RefreshCw,
} from 'lucide-react';
import {
  getResumenAcuerdos,
  listAcuerdos,
  getAcuerdo,
  registrarPagoAcuerdo,
  marcarAcuerdoIncumplido,
  crearNotaAcuerdo,
  type ResumenAcuerdos,
  type AcuerdoListItem,
  type ListAcuerdosParams,
} from '../services/acuerdos';
import { getApiErrorMessage } from '../services/api';
import type {
  Acuerdo,
  EstadoAcuerdo,
  EstadoCuota,
} from '../data/acuerdosMock';

// ── Helpers ──────────────────────────────────────────────
const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(v);

const formatCOPCompact = (v: number) => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)} MM`;
  if (v >= 1_000_000)     return `$${(v / 1_000_000).toFixed(1)} M`;
  if (v >= 1_000)         return `$${(v / 1_000).toFixed(0)} K`;
  return formatCOP(v);
};

const formatFecha = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ESTADO_BADGE: Record<EstadoAcuerdo, { bg: string; text: string; Icon: typeof CheckCircle2 }> = {
  Vigente:    { bg: 'bg-emerald-50', text: 'text-emerald-600', Icon: TrendingUp },
  Cumplido:   { bg: 'bg-blue-50',    text: 'text-blue-600',    Icon: CheckCircle2 },
  Incumplido: { bg: 'bg-red-50',     text: 'text-red-600',     Icon: XCircle },
  Vencido:    { bg: 'bg-amber-50',   text: 'text-amber-600',   Icon: AlertCircle },
};

const ESTADO_CUOTA_BADGE: Record<EstadoCuota, string> = {
  Pagada:    'bg-emerald-50 text-emerald-600',
  Pendiente: 'bg-slate-100 text-slate-500',
  Atrasada:  'bg-red-50 text-red-600',
};

type RangoFecha = 'todos' | 'semana' | 'mes' | 'vencido';
type SortKey = NonNullable<ListAcuerdosParams['sortBy']>;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

// ── Componente principal ─────────────────────────────────
export function Acuerdos() {
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | EstadoAcuerdo>('todos');
  const [fechaFiltro, setFechaFiltro] = useState<RangoFecha>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('proximoPago');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [resumen, setResumen] = useState<ResumenAcuerdos | null>(null);
  const [items, setItems] = useState<AcuerdoListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchDebounced, setSearchDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo<ListAcuerdosParams>(() => ({
    page,
    limit: PAGE_SIZE,
    search: searchDebounced || undefined,
    estado: estadoFiltro === 'todos' ? undefined : estadoFiltro,
    rangoFecha: fechaFiltro === 'todos' ? undefined : fechaFiltro,
    sortBy: sortKey,
    sortDir,
  }), [page, searchDebounced, estadoFiltro, fechaFiltro, sortKey, sortDir]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, listed] = await Promise.all([
        getResumenAcuerdos(),
        listAcuerdos(params),
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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleLimpiar = () => {
    setSearch(''); setEstadoFiltro('todos'); setFechaFiltro('todos'); setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-navy-dark">Acuerdos</h2>
            <FileText className="text-[#006875] w-5 h-5" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Gestión de planes de pago activos, cumplidos e incumplidos.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#006875] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#004f58] transition-all">
          <Plus size={18} /> Nuevo acuerdo
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Acuerdos vigentes"        value={String(resumen?.vigentes ?? 0)}                   trend="planes activos"        Icon={Wallet}       color="emerald" />
        <KpiCard title="Cumplidos este mes"       value={String(resumen?.cumplidosMes ?? 0)}               trend="acuerdos pagados"      Icon={CheckCircle2} color="blue"    />
        <KpiCard title="Incumplidos / vencidos"   value={String(resumen?.incumplidos ?? 0)}                trend="requieren gestión"     Icon={AlertCircle}  color="purple"  isBadTrend />
        <KpiCard title="Monto comprometido"       value={formatCOPCompact(resumen?.montoComprometido ?? 0)} trend="cartera bajo acuerdo"  Icon={BarChart3}    color="indigo"  />
      </div>

      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, ID de acuerdo o cliente..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Estado"
              value={estadoFiltro}
              onChange={(v) => { setEstadoFiltro(v as typeof estadoFiltro); setPage(1); }}
              options={[
                { value: 'todos',      label: 'Todos' },
                { value: 'Vigente',    label: 'Vigente' },
                { value: 'Cumplido',   label: 'Cumplido' },
                { value: 'Incumplido', label: 'Incumplido' },
                { value: 'Vencido',    label: 'Vencido' },
              ]}
            />
            <FilterSelect
              label="Próximo pago"
              value={fechaFiltro}
              onChange={(v) => { setFechaFiltro(v as RangoFecha); setPage(1); }}
              options={[
                { value: 'todos',   label: 'Todos' },
                { value: 'semana',  label: 'Esta semana' },
                { value: 'mes',     label: 'Este mes' },
                { value: 'vencido', label: 'Ya vencido' },
              ]}
            />
            <button
              onClick={handleLimpiar}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy-dark border border-slate-200 bg-white rounded-xl px-3 py-2 hover:border-slate-300 transition-colors"
            >
              <Filter size={14} /> Limpiar
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 uppercase tracking-widest text-[9px] font-bold text-slate-400">
                <Th label="Cliente"        sortKey="cliente"      current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Monto acordado" sortKey="monto"        current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                <Th label="Cuotas"         sortKey="cuotas"       current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Próximo pago"   sortKey="proximoPago"  current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Cumplimiento"   sortKey="cumplimiento" current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Estado"         sortKey="estado"       current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-5 py-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 size={24} className="animate-spin" />
                    <p className="text-xs font-medium">Cargando acuerdos...</p>
                  </div>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="inline-flex flex-col items-center gap-3 text-center">
                    <AlertCircle size={24} className="text-red-500" />
                    <p className="text-xs font-bold text-navy-dark">No se pudieron cargar los acuerdos</p>
                    <p className="text-[11px] text-slate-500">{error}</p>
                    <button onClick={() => void load()} className="btn-primary flex items-center gap-2 text-xs">
                      <RefreshCw size={12} /> Reintentar
                    </button>
                  </div>
                </td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 text-sm font-medium">
                    No hay acuerdos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                items.map((a) => {
                  const eb = ESTADO_BADGE[a.estado];
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-navy-dark">{a.clienteNombre}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{a.id} · {a.clienteId}</p>
                      </td>
                      <td className="px-5 py-4 text-right text-xs font-bold text-navy-dark">
                        {formatCOP(a.montoAcordado)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-navy-dark">
                          {a.cuotasPagadas} <span className="text-slate-400 font-medium">de</span> {a.cuotasTotales}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {a.proximoPago ? (
                          <>
                            <p className="text-[11px] text-slate-600 font-medium">{formatFecha(a.proximoPago.fecha)}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{formatCOP(a.proximoPago.monto)}</p>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <ProgressBar pct={a.cumplimiento} />
                      </td>
                      <td className="px-5 py-4">
                        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest', eb.bg, eb.text)}>
                          <eb.Icon size={11} /> {a.estado}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedId(a.id)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#006875] hover:bg-[#006875]/10 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> Ver detalle
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
            <span className="font-bold text-navy-dark">{totalItems}</span> acuerdos
          </p>
          <div className="flex items-center gap-1">
            <PagerBtn disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={14} />
            </PagerBtn>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={clsx(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  n === safePage ? 'bg-[#006875] text-white' : 'text-slate-500 hover:bg-slate-100',
                )}
              >
                {n}
              </button>
            ))}
            <PagerBtn disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight size={14} />
            </PagerBtn>
          </div>
        </div>
      </div>

      {selectedId && (
        <AcuerdoDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => void load()}
        />
      )}
    </div>
  );
}

// ── Subcomponentes ───────────────────────────────────────
interface KpiCardProps {
  title: string; value: string; trend: string;
  Icon: typeof Wallet;
  color: 'blue' | 'indigo' | 'purple' | 'emerald';
  isBadTrend?: boolean;
}
function KpiCard({ title, value, trend, Icon, color, isBadTrend }: KpiCardProps) {
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
      <div className="flex items-center gap-1.5">
        {isBadTrend
          ? <TrendingDown size={14} className="text-red-400" />
          : <TrendingUp   size={14} className="text-emerald-500" />}
        <span className={clsx('text-[10px] font-bold', isBadTrend ? 'text-red-400' : 'text-emerald-500')}>{trend}</span>
      </div>
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 focus-within:ring-2 focus-within:ring-[#00e5ff]/20">
      <span className="text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-navy-dark font-bold text-xs focus:outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Th({
  label, sortKey, current, dir, onSort, align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = current === sortKey;
  const ArrowIcon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={clsx('px-5 py-4 font-bold select-none', align === 'right' && 'text-right')}>
      <button
        onClick={() => onSort(sortKey)}
        className={clsx(
          'inline-flex items-center gap-1.5 hover:text-navy-dark transition-colors',
          active && 'text-navy-dark',
        )}
      >
        {label} <ArrowIcon size={12} />
      </button>
    </th>
  );
}

function PagerBtn({ disabled, onClick, children }: {
  disabled: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? 'bg-emerald-500' :
    pct >= 50 ? 'bg-cyan-500' :
    pct >= 25 ? 'bg-amber-400' :
                'bg-red-400';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-bold text-navy-dark shrink-0 w-9 text-right">{pct}%</span>
    </div>
  );
}

// ── Drawer lateral ───────────────────────────────────────
function AcuerdoDrawer({
  id, onClose, onUpdated,
}: { id: string; onClose: () => void; onUpdated: () => void }) {
  const [acuerdo, setAcuerdo] = useState<Acuerdo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevaNota, setNuevaNota] = useState('');
  const [busy, setBusy] = useState<'nota' | 'pago' | 'incumplir' | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setAcuerdo(await getAcuerdo(id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [id]);

  const handleAgregarNota = async () => {
    if (!nuevaNota.trim() || !acuerdo) return;
    setBusy('nota');
    try {
      const nota = await crearNotaAcuerdo(acuerdo.id, nuevaNota.trim());
      setAcuerdo({ ...acuerdo, notas: [nota, ...acuerdo.notas] });
      setNuevaNota('');
      onUpdated();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleRegistrarPago = async () => {
    if (!acuerdo || !acuerdo.proximoPago) return;
    setBusy('pago');
    try {
      const updated = await registrarPagoAcuerdo(acuerdo.id, {
        monto: acuerdo.proximoPago.monto,
        fecha: new Date().toISOString().slice(0, 10),
      });
      setAcuerdo(updated);
      onUpdated();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleMarcarIncumplido = async () => {
    if (!acuerdo) return;
    setBusy('incumplir');
    try {
      const updated = await marcarAcuerdoIncumplido(acuerdo.id);
      setAcuerdo(updated);
      onUpdated();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const eb = acuerdo ? ESTADO_BADGE[acuerdo.estado] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-navy-dark/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <aside
        className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00b4d8] to-[#00e5ff] text-navy-dark font-bold flex items-center justify-center shrink-0 text-sm">
              {acuerdo ? initials(acuerdo.clienteNombre) : '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-dark leading-tight">
                {acuerdo?.clienteNombre ?? 'Cargando...'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {id}{acuerdo ? ` · ${acuerdo.clienteId}` : ''}
              </p>
              {acuerdo && eb && (
                <span className={clsx('inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest', eb.bg, eb.text)}>
                  <eb.Icon size={10} /> {acuerdo.estado}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-navy-dark p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : error || !acuerdo ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <AlertCircle size={28} className="text-red-500" />
            <p className="text-xs text-slate-500">{error ?? 'No se pudo cargar el acuerdo.'}</p>
            <button onClick={() => void load()} className="btn-primary text-xs">Reintentar</button>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-6 flex-1">
              <Section title="Información del cliente">
                <InfoRow Icon={Phone}    label="Teléfono"        value={acuerdo.clienteTelefono ?? '—'} />
                <InfoRow Icon={Mail}     label="Correo"          value={acuerdo.clienteEmail ?? '—'} />
                <InfoRow Icon={UserIcon} label="Gestor asignado" value={acuerdo.gestor} />
              </Section>

              <Section title="Deuda y acuerdo">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Stat label="Deuda original"  value={formatCOP(acuerdo.deudaOriginal)} valueClass="text-slate-700" />
                  <Stat label="Monto acordado"  value={formatCOP(acuerdo.montoAcordado)} valueClass="text-navy-dark" />
                  <Stat label="Cuotas"          value={`${acuerdo.cuotasPagadas} de ${acuerdo.cuotasTotales}`} valueClass="text-navy-dark" />
                  <Stat label="Valor por cuota" value={formatCOP(acuerdo.valorCuota)}    valueClass="text-navy-dark" />
                </div>
                {acuerdo.condiciones && (
                  <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-4 mb-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Condiciones pactadas</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-line">{acuerdo.condiciones}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow Icon={Calendar} label="Inicio" value={formatFecha(acuerdo.fechaInicio)} />
                  <InfoRow Icon={Calendar} label="Fin"    value={formatFecha(acuerdo.fechaFin)} />
                </div>
                {acuerdo.proximoPago && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-cyan-600 shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-cyan-700 font-bold uppercase tracking-widest leading-none">Próximo pago</p>
                      <p className="text-xs font-bold text-navy-dark">{formatFecha(acuerdo.proximoPago.fecha)} · {formatCOP(acuerdo.proximoPago.monto)}</p>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <ProgressBar pct={acuerdo.cumplimiento} />
                </div>
              </Section>

              <Section title="Historial de pagos">
                {acuerdo.cuotas.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium italic">Sin cuotas registradas.</p>
                ) : (
                  <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-50">
                    {acuerdo.cuotas.map((c) => (
                      <li key={c.numero} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                            {c.numero}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-navy-dark">{formatCOP(c.monto)}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {c.estado === 'Pagada' && c.fechaPago
                                ? `Pagada el ${formatFecha(c.fechaPago)}`
                                : `Programada para ${formatFecha(c.fechaProgramada)}`}
                            </p>
                          </div>
                        </div>
                        <span className={clsx('px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest', ESTADO_CUOTA_BADGE[c.estado])}>
                          {c.estado}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Notas de seguimiento">
                {acuerdo.notas.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium italic mb-3">Aún no hay notas registradas.</p>
                ) : (
                  <ul className="space-y-3 mb-4">
                    {acuerdo.notas.map((n) => (
                      <li key={n.id} className="rounded-2xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-navy-dark">
                            <FileText size={12} className="text-slate-400" /> {n.autor}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{formatFecha(n.fecha)}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.texto}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <textarea
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    rows={3}
                    placeholder="Escribe una nota de seguimiento..."
                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 resize-none"
                  />
                  <button
                    onClick={() => void handleAgregarNota()}
                    disabled={!nuevaNota.trim() || busy === 'nota'}
                    className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {busy === 'nota' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {busy === 'nota' ? 'Guardando...' : 'Agregar nota'}
                  </button>
                </div>
              </Section>
            </div>

            <footer className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex items-center gap-3 justify-end">
              <button
                onClick={() => void handleMarcarIncumplido()}
                disabled={busy !== null || acuerdo.estado === 'Incumplido' || acuerdo.estado === 'Cumplido'}
                className="flex items-center gap-2 border border-red-200 text-red-600 bg-white hover:bg-red-50 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy === 'incumplir' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Marcar incumplido
              </button>
              <button
                onClick={() => void handleRegistrarPago()}
                disabled={busy !== null || !acuerdo.proximoPago}
                className="flex items-center gap-2 bg-[#006875] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#004f58] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {busy === 'pago' ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                Registrar pago
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + second).toUpperCase() || '?';
}
