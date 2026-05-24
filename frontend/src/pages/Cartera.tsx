import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown,
  ArrowUp, ArrowDown, X, Phone, Mail, Calendar, TrendingDown,
  ShieldCheck, AlertTriangle, TrendingUp, Sparkles, FileText, Plus,
  CircleCheckBig, BarChart3, Landmark, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';
import {
  getResumenCartera,
  listClientesCartera,
  getClienteCartera,
  crearNotaCartera,
  generarEstrategiaCartera,
  type ResumenCartera,
  type ClienteListItem,
  type ListClientesParams,
} from '../services/cartera';
import { getApiErrorMessage } from '../services/api';
import type {
  ClienteCartera,
  EstadoCartera,
} from '../data/carteraMock';

// ── Helpers ──────────────────────────────────────────────
// Formato uniforme en millones para todos los montos de Cartera.
// Ej: 1.234.567.890 → "$1.234M" · 865.000.000 → "$865M" · 1.500.000 → "$1,50M".
const MILLONES_FORMATTER_INT  = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const MILLONES_FORMATTER_DEC1 = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MILLONES_FORMATTER_DEC2 = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMillones = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return '$0M';
  const m = value / 1_000_000;
  const abs = Math.abs(m);
  const fmt = abs >= 100 ? MILLONES_FORMATTER_INT
            : abs >= 10  ? MILLONES_FORMATTER_DEC1
                         : MILLONES_FORMATTER_DEC2;
  return `$${fmt.format(m)}M`;
};

const formatFecha = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ESTADO_BADGE: Record<EstadoCartera, string> = {
  'Al día':    'bg-emerald-50 text-emerald-600',
  'En mora':   'bg-amber-50 text-amber-600',
  'Castigada': 'bg-slate-200 text-slate-600',
};

const moraColor = (dias: number) => {
  if (dias === 0)  return 'text-emerald-600';
  if (dias <= 30)  return 'text-amber-600';
  if (dias <= 90)  return 'text-orange-600';
  return 'text-red-600';
};

type RangoMora = 'todos' | '1-30' | '31-60' | '61-90' | '+90';
type SortKey = NonNullable<ListClientesParams['sortBy']>;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

// ── Componente principal ─────────────────────────────────
export function Cartera() {
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | EstadoCartera>('todos');
  const [moraFiltro, setMoraFiltro] = useState<RangoMora>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('diasMora');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [resumen, setResumen] = useState<ResumenCartera | null>(null);
  const [items, setItems] = useState<ClienteListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce del search para no disparar petición en cada tecla.
  const [searchDebounced, setSearchDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo<ListClientesParams>(() => ({
    page,
    limit: PAGE_SIZE,
    search: searchDebounced || undefined,
    estado: estadoFiltro === 'todos' ? undefined : estadoFiltro,
    rangoMora: moraFiltro === 'todos' ? undefined : moraFiltro,
    sortBy: sortKey,
    sortDir,
  }), [page, searchDebounced, estadoFiltro, moraFiltro, sortKey, sortDir]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, listed] = await Promise.all([
        getResumenCartera(),
        listClientesCartera(params),
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
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleLimpiar = () => {
    setSearch('');
    setEstadoFiltro('todos');
    setMoraFiltro('todos');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const ultimaActualizacion = resumen?.ultimaActualizacion
    ? new Date(resumen.ultimaActualizacion).toLocaleString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  return (
    <div className="space-y-8 pb-12">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-3xl font-bold tracking-tight text-navy-dark">Cartera</h2>
          <Landmark className="text-[#006875] w-5 h-5" />
        </div>
        <p className="text-slate-500 text-sm font-medium">
          Última actualización: <span className="font-semibold text-slate-700">{ultimaActualizacion}</span>
        </p>
      </header>

      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-2xl font-bold tracking-tight text-navy-dark mb-2">
          Explora tu cartera en detalle
        </h3>
        <p className="text-sm font-medium text-slate-500">
          Consulta el estado individual de cada crédito, filtra por estado de riesgo y días de mora.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre o ID..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Estado"
              value={estadoFiltro}
              onChange={(v) => { setEstadoFiltro(v as typeof estadoFiltro); setPage(1); }}
              options={[
                { value: 'todos',     label: 'Todos' },
                { value: 'Al día',    label: 'Al día' },
                { value: 'En mora',   label: 'En mora' },
                { value: 'Castigada', label: 'Castigada' },
              ]}
            />
            <FilterSelect
              label="Mora"
              value={moraFiltro}
              onChange={(v) => { setMoraFiltro(v as RangoMora); setPage(1); }}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: '1-30',  label: '1-30 días' },
                { value: '31-60', label: '31-60 días' },
                { value: '61-90', label: '61-90 días' },
                { value: '+90',   label: '+90 días' },
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 uppercase tracking-widest text-[9px] font-bold text-slate-400">
                <Th label="Cliente"      sortKey="nombre"     current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Deuda total"  sortKey="deudaTotal" current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                <Th label="Días mora"    sortKey="diasMora"   current={sortKey} dir={sortDir} onSort={handleSort} align="right" />
                <Th label="Último pago"  sortKey="ultimoPago" current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Estado"       sortKey="estado"     current={sortKey} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16">
                  <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 size={24} className="animate-spin" />
                    <p className="text-xs font-medium">Cargando cartera...</p>
                  </div>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="text-center py-16">
                  <div className="inline-flex flex-col items-center gap-3 text-center">
                    <AlertCircle size={24} className="text-red-500" />
                    <p className="text-xs font-bold text-navy-dark">No se pudo cargar la cartera</p>
                    <p className="text-[11px] text-slate-500">{error}</p>
                    <button onClick={() => void load()} className="btn-primary flex items-center gap-2 text-xs">
                      <RefreshCw size={12} /> Reintentar
                    </button>
                  </div>
                </td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400 text-sm font-medium">
                    No hay clientes que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-navy-dark">{c.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{c.id}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-xs font-bold text-navy-dark">
                      {formatMillones(c.deudaTotal)}
                    </td>
                    <td className={clsx('px-5 py-4 text-right text-xs font-bold', moraColor(c.diasMora))}>
                      {c.diasMora === 0 ? '—' : c.diasMora}
                    </td>
                    <td className="px-5 py-4 text-[11px] text-slate-600 font-medium">
                      {formatFecha(c.ultimoPago)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx('px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest', ESTADO_BADGE[c.estado])}>
                        {c.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <p>
            Mostrando <span className="font-bold text-navy-dark">{items.length}</span> de{' '}
            <span className="font-bold text-navy-dark">{totalItems}</span> clientes
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
        <ClienteDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onNotaCreada={() => void load()}
        />
      )}
    </div>
  );
}

// ── Subcomponentes ───────────────────────────────────────
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

// ── Drawer lateral ───────────────────────────────────────
function ClienteDrawer({
  id, onClose, onNotaCreada,
}: { id: string; onClose: () => void; onNotaCreada: () => void }) {
  const [cliente, setCliente] = useState<ClienteCartera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevaNota, setNuevaNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [generandoEstrategia, setGenerandoEstrategia] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getClienteCartera(id);
      setCliente(c);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [id]);

  const handleAgregarNota = async () => {
    if (!nuevaNota.trim() || !cliente) return;
    setGuardandoNota(true);
    try {
      const nota = await crearNotaCartera(cliente.id, nuevaNota.trim());
      setCliente({ ...cliente, notas: [nota, ...cliente.notas] });
      setNuevaNota('');
      onNotaCreada();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setGuardandoNota(false);
    }
  };

  const handleGenerarEstrategia = async () => {
    if (!cliente) return;
    setGenerandoEstrategia(true);
    try {
      const est = await generarEstrategiaCartera(cliente.id);
      setCliente({ ...cliente, estrategia: est });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setGenerandoEstrategia(false);
    }
  };

  const RiesgoIcon = cliente?.riesgo === 'Alto' ? AlertTriangle :
                     cliente?.riesgo === 'Medio' ? TrendingUp : ShieldCheck;

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
              {cliente ? initials(cliente.nombre) : '?'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-dark leading-tight">
                {cliente?.nombre ?? 'Cargando...'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">{id}</p>
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
        ) : error || !cliente ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <AlertCircle size={28} className="text-red-500" />
            <p className="text-xs text-slate-500">{error ?? 'No se pudo cargar el detalle.'}</p>
            <button onClick={() => void load()} className="btn-primary text-xs">Reintentar</button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <Section title="Información general">
              <InfoRow Icon={Phone}    label="Teléfono"    value={cliente.telefono ?? '—'} />
              <InfoRow Icon={Mail}     label="Correo"      value={cliente.email ?? '—'} />
              <InfoRow Icon={Calendar} label="Vinculación" value={formatFecha(cliente.fechaVinculacion)} />
            </Section>

            <Section title="Estado de cartera">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Stat label="Monto adeudado" value={formatMillones(cliente.deudaTotal)} valueClass="text-navy-dark" />
                <Stat
                  label="Días de mora"
                  value={cliente.diasMora === 0 ? 'Sin mora' : `${cliente.diasMora} días`}
                  valueClass={moraColor(cliente.diasMora)}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Últimos 5 pagos</p>
              {cliente.ultimosPagos.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium italic mb-4">Sin pagos registrados.</p>
              ) : (
                <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-4">
                  {cliente.ultimosPagos.map((p, i) => (
                    <li key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                      <span className="text-slate-500 font-medium">{formatFecha(p.fecha)}</span>
                      <span className="font-bold text-navy-dark">{formatMillones(p.monto)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Comportamiento de pago</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{cliente.comportamientoPago}</p>
              </div>
            </Section>

            <Section title="Clasificación">
              <div className="flex items-center gap-3 mb-4">
                <div className={clsx(
                  'w-10 h-10 rounded-2xl flex items-center justify-center',
                  cliente.riesgo === 'Alto'  && 'bg-red-50 text-red-500',
                  cliente.riesgo === 'Medio' && 'bg-amber-50 text-amber-500',
                  cliente.riesgo === 'Bajo'  && 'bg-emerald-50 text-emerald-500',
                )}>
                  <RiesgoIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nivel de riesgo</p>
                  <p className="text-sm font-bold text-navy-dark">Riesgo {cliente.riesgo}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Productos activos</p>
              <ul className="space-y-2">
                {cliente.productos.map((p, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-100 text-xs">
                    <span className="font-bold text-navy-dark">{p.tipo}</span>
                    <span className="font-bold text-slate-600">{formatMillones(p.monto)}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Estrategia asignada">
              {cliente.estrategia ? (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={14} />
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">
                      {cliente.estrategia.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{cliente.estrategia.resumen}</p>
                </div>
              ) : (
                <button
                  onClick={() => void handleGenerarEstrategia()}
                  disabled={generandoEstrategia}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-slate-500 hover:border-[#006875] hover:text-[#006875] rounded-2xl py-4 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {generandoEstrategia ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generandoEstrategia ? 'Generando...' : 'Generar estrategia con IA'}
                </button>
              )}
            </Section>

            <Section title="Notas de gestión">
              {cliente.notas.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium italic mb-3">Aún no hay notas registradas.</p>
              ) : (
                <ul className="space-y-3 mb-4">
                  {cliente.notas.map((n) => (
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
                  placeholder="Escribe una nota de gestión..."
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 resize-none"
                />
                <button
                  onClick={() => void handleAgregarNota()}
                  disabled={!nuevaNota.trim() || guardandoNota}
                  className="flex items-center gap-2 bg-[#006875] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#004f58] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {guardandoNota ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {guardandoNota ? 'Guardando...' : 'Agregar nota'}
                </button>
              </div>
            </Section>
          </div>
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
