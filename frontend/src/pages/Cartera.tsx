import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  Search, Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown,
  ArrowUp, ArrowDown, X, Phone, Mail, Calendar, Wallet, TrendingDown,
  ShieldCheck, AlertTriangle, TrendingUp, Sparkles, FileText, Plus,
  CircleCheckBig, BarChart3, Landmark, AlertCircle, Eye,
} from 'lucide-react';
import {
  carteraMock,
  type ClienteCartera,
  type NivelRiesgo,
  type EstadoCartera,
} from '../data/carteraMock';

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

const formatFecha = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const RIESGO_BADGE: Record<NivelRiesgo, string> = {
  Bajo:  'bg-emerald-50 text-emerald-600',
  Medio: 'bg-amber-50 text-amber-600',
  Alto:  'bg-red-50 text-red-600',
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
type SortKey = 'nombre' | 'deudaTotal' | 'diasMora' | 'ultimoPago' | 'riesgo' | 'estado';
type SortDir = 'asc' | 'desc';

const RIESGO_ORDER: Record<NivelRiesgo, number> = { Bajo: 0, Medio: 1, Alto: 2 };
const ESTADO_ORDER: Record<EstadoCartera, number> = { 'Al día': 0, 'En mora': 1, 'Castigada': 2 };

const PAGE_SIZE = 10;

// ── Componente principal ─────────────────────────────────
export function Cartera() {
  const [search, setSearch] = useState('');
  const [riesgoFiltro, setRiesgoFiltro] = useState<'todos' | NivelRiesgo>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | EstadoCartera>('todos');
  const [moraFiltro, setMoraFiltro] = useState<RangoMora>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('diasMora');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ClienteCartera | null>(null);

  // KPIs calculados desde el mock (en real vendría del backend).
  const kpis = useMemo(() => {
    const total = carteraMock.reduce((acc, c) => acc + c.deudaTotal, 0);
    const vencida = carteraMock
      .filter((c) => c.estado === 'En mora' || c.estado === 'Castigada')
      .reduce((acc, c) => acc + c.deudaTotal, 0);
    const alDia = carteraMock
      .filter((c) => c.estado === 'Al día')
      .reduce((acc, c) => acc + c.deudaTotal, 0);
    const recuperadoMes = carteraMock.reduce((acc, c) => {
      const ahora = new Date();
      const recientes = c.ultimosPagos.filter((p) => {
        const fp = new Date(p.fecha);
        return fp.getFullYear() === ahora.getFullYear() && fp.getMonth() === ahora.getMonth();
      });
      return acc + recientes.reduce((a, p) => a + p.monto, 0);
    }, 0);
    return { total, vencida, alDia, recuperadoMes };
  }, []);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return carteraMock.filter((c) => {
      if (q && !c.nombre.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
      if (riesgoFiltro !== 'todos' && c.riesgo !== riesgoFiltro) return false;
      if (estadoFiltro !== 'todos' && c.estado !== estadoFiltro) return false;
      if (moraFiltro !== 'todos') {
        if (moraFiltro === '1-30'  && !(c.diasMora >= 1 && c.diasMora <= 30))  return false;
        if (moraFiltro === '31-60' && !(c.diasMora >= 31 && c.diasMora <= 60)) return false;
        if (moraFiltro === '61-90' && !(c.diasMora >= 61 && c.diasMora <= 90)) return false;
        if (moraFiltro === '+90'   && !(c.diasMora > 90))                       return false;
      }
      return true;
    });
  }, [search, riesgoFiltro, estadoFiltro, moraFiltro]);

  const ordenados = useMemo(() => {
    const arr = [...filtrados];
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'nombre':     return a.nombre.localeCompare(b.nombre) * dir;
        case 'deudaTotal': return (a.deudaTotal - b.deudaTotal) * dir;
        case 'diasMora':   return (a.diasMora - b.diasMora) * dir;
        case 'ultimoPago': return (new Date(a.ultimoPago).getTime() - new Date(b.ultimoPago).getTime()) * dir;
        case 'riesgo':     return (RIESGO_ORDER[a.riesgo] - RIESGO_ORDER[b.riesgo]) * dir;
        case 'estado':     return (ESTADO_ORDER[a.estado] - ESTADO_ORDER[b.estado]) * dir;
        default: return 0;
      }
    });
    return arr;
  }, [filtrados, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(ordenados.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginados = ordenados.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleLimpiar = () => {
    setSearch('');
    setRiesgoFiltro('todos');
    setEstadoFiltro('todos');
    setMoraFiltro('todos');
    setPage(1);
  };

  const ultimaActualizacion = new Date().toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-navy-dark">Cartera</h2>
            <Wallet className="text-[#006875] w-5 h-5" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Última actualización: <span className="font-semibold text-slate-700">{ultimaActualizacion}</span>
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#006875] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#004f58] transition-all">
          <Download size={18} />
          <span>Exportar</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total cartera"        value={formatCOPCompact(kpis.total)}          trend="+2.1% vs mes anterior"  Icon={Landmark}       color="blue"    />
        <KpiCard title="Cartera vencida"      value={formatCOPCompact(kpis.vencida)}        trend="-3.4% vs mes anterior"  Icon={AlertCircle}    color="purple"  isBadTrend />
        <KpiCard title="Cartera al día"       value={formatCOPCompact(kpis.alDia)}          trend="+4.7% vs mes anterior"  Icon={CircleCheckBig} color="emerald" />
        <KpiCard title="Recuperado (mes)"     value={formatCOPCompact(kpis.recuperadoMes)}  trend="+6.2% vs mes anterior"  Icon={BarChart3}      color="indigo"  />
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
              label="Riesgo"
              value={riesgoFiltro}
              onChange={(v) => { setRiesgoFiltro(v as typeof riesgoFiltro); setPage(1); }}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'Bajo',  label: 'Bajo' },
                { value: 'Medio', label: 'Medio' },
                { value: 'Alto',  label: 'Alto' },
              ]}
            />
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
                <Th label="Riesgo"       sortKey="riesgo"     current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Estado"       sortKey="estado"     current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-5 py-4 font-bold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {paginados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 text-sm font-medium">
                    No hay clientes que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                paginados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-navy-dark">{c.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{c.id}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-xs font-bold text-navy-dark">
                      {formatCOP(c.deudaTotal)}
                    </td>
                    <td className={clsx('px-5 py-4 text-right text-xs font-bold', moraColor(c.diasMora))}>
                      {c.diasMora === 0 ? '—' : `${c.diasMora}d`}
                    </td>
                    <td className="px-5 py-4 text-[11px] text-slate-600 font-medium">
                      {formatFecha(c.ultimoPago)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx('px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest', RIESGO_BADGE[c.riesgo])}>
                        {c.riesgo}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx('px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest', ESTADO_BADGE[c.estado])}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelected(c)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#006875] hover:bg-[#006875]/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye size={13} /> Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <p>
            Mostrando <span className="font-bold text-navy-dark">{paginados.length}</span> de{' '}
            <span className="font-bold text-navy-dark">{ordenados.length}</span> clientes
          </p>
          <div className="flex items-center gap-1">
            <PagerBtn disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={14} />
            </PagerBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
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

      {selected && <ClienteDrawer cliente={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Subcomponentes ───────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  Icon: typeof Landmark;
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

// ── Drawer lateral ───────────────────────────────────────
function ClienteDrawer({ cliente, onClose }: { cliente: ClienteCartera; onClose: () => void }) {
  const [nuevaNota, setNuevaNota] = useState('');
  const RiesgoIcon =
    cliente.riesgo === 'Alto' ? AlertTriangle :
    cliente.riesgo === 'Medio' ? TrendingUp : ShieldCheck;

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
              {initials(cliente.nombre)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-dark leading-tight">{cliente.nombre}</h3>
              <p className="text-xs text-slate-400 font-medium">{cliente.id}</p>
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

        <div className="p-6 space-y-6">
          <Section title="Información general">
            <InfoRow Icon={Phone}    label="Teléfono" value={cliente.telefono} />
            <InfoRow Icon={Mail}     label="Correo"   value={cliente.email} />
            <InfoRow Icon={Calendar} label="Vinculación" value={formatFecha(cliente.fechaVinculacion)} />
          </Section>

          <Section title="Estado de cartera">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Stat label="Monto adeudado" value={formatCOP(cliente.deudaTotal)} valueClass="text-navy-dark" />
              <Stat
                label="Días de mora"
                value={cliente.diasMora === 0 ? 'Sin mora' : `${cliente.diasMora} días`}
                valueClass={moraColor(cliente.diasMora)}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Últimos 5 pagos</p>
            <ul className="rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-4">
              {cliente.ultimosPagos.map((p, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <span className="text-slate-500 font-medium">{formatFecha(p.fecha)}</span>
                  <span className="font-bold text-navy-dark">{formatCOP(p.monto)}</span>
                </li>
              ))}
            </ul>
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
                  <span className="font-bold text-slate-600">{formatCOP(p.monto)}</span>
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
              <button className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-slate-500 hover:border-[#006875] hover:text-[#006875] rounded-2xl py-4 text-xs font-bold transition-colors">
                <Sparkles size={14} /> Generar estrategia con IA
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
                disabled={!nuevaNota.trim()}
                className="flex items-center gap-2 bg-[#006875] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-[#004f58] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Plus size={14} /> Agregar nota
              </button>
            </div>
          </Section>
        </div>
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
