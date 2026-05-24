import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, ChevronDown, Landmark, AlertCircle, CircleCheckBig,
  BarChart3, Wallet, Clock, CalendarDays, AlertTriangle, Info,
  PieChart as PieIcon, Loader2, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  getStats,
  getDistribucionCartera,
  getEvolucionRecuperacion,
} from '../services/dashboard';
import { getApiErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  formatPorcentaje,
  formatFechaCorta,
  calificacionLabel,
} from '../utils/format';

// Formato uniforme en millones para todos los montos del Dashboard.
// Ej: 1.234.567.890 → "$1.234M" · 865.000.000 → "$865M" · 1.500.000 → "$1,50M".
const MILLONES_FORMATTER_INT  = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const MILLONES_FORMATTER_DEC1 = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MILLONES_FORMATTER_DEC2 = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function formatMillones(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '$0M';
  const m = value / 1_000_000;
  const abs = Math.abs(m);
  const fmt = abs >= 100 ? MILLONES_FORMATTER_INT
            : abs >= 10  ? MILLONES_FORMATTER_DEC1
                         : MILLONES_FORMATTER_DEC2;
  return `$${fmt.format(m)}M`;
}
import type {
  DashboardStats,
  DistribucionCarteraItem,
  EvolucionRecuperacionItem,
  Calificacion,
} from '../types/api';

const CAT_STYLES: Record<Calificacion, {
  bar: string; iconBg: string; iconColor: string; badgeBg: string; badgeText: string;
  Icon: typeof Wallet;
}> = {
  A: { bar: '#22c55e', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600', Icon: Wallet },
  B: { bar: '#f59e0b', iconBg: 'bg-amber-50',   iconColor: 'text-amber-500',   badgeBg: 'bg-amber-50',   badgeText: 'text-amber-600',   Icon: Clock },
  C: { bar: '#fb923c', iconBg: 'bg-orange-50',  iconColor: 'text-orange-500',  badgeBg: 'bg-orange-50',  badgeText: 'text-orange-600',  Icon: CalendarDays },
  D: { bar: '#f87171', iconBg: 'bg-red-50',     iconColor: 'text-red-400',     badgeBg: 'bg-red-50',     badgeText: 'text-red-400',     Icon: AlertTriangle },
  E: { bar: '#ef4444', iconBg: 'bg-red-50',     iconColor: 'text-red-500',     badgeBg: 'bg-red-50',     badgeText: 'text-red-500',     Icon: AlertTriangle },
};

interface DashboardData {
  stats: DashboardStats;
  distribucion: DistribucionCarteraItem[];
  evolucion: EvolucionRecuperacionItem[];
}

type EvolucionMeses = 3 | 6 | 12;

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evolucionMeses, setEvolucionMeses] = useState<EvolucionMeses>(12);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, distribucion, evolucion] = await Promise.all([
        getStats(),
        getDistribucionCartera(),
        getEvolucionRecuperacion(),
      ]);
      setData({ stats, distribucion, evolucion });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // El backend ya devuelve un arreglo ordenado por mes y sin valores futuros.
  // El selector recorta los últimos N meses para visualizar 12/6/3.
  const evolucionFiltrada = useMemo(() => {
    const evo = data?.evolucion ?? [];
    return evo.slice(-evolucionMeses);
  }, [data?.evolucion, evolucionMeses]);

  const firstName = user?.name?.split(' ')[0] ?? 'Administrador';

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm font-medium">Cargando datos del dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle size={32} className="text-red-500" />
        <div>
          <p className="text-sm font-bold text-navy-dark">No se pudo cargar el dashboard</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
        <button onClick={() => void load()} className="btn-primary flex items-center gap-2">
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats ?? null;
  const distribucion = data.distribucion ?? [];

  return (
    <div className="space-y-8 pb-12">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-3xl font-bold tracking-tight">¡Hola, {firstName}! 👋</h2>
        </div>
        <p className="text-slate-500 text-sm font-medium">Este es el resumen general de la cartera y la gestión de hoy.</p>
      </header>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Cartera total"        value={formatMillones(stats.carteraTotal ?? 0)}     trend={`${stats.tendencias?.carteraTotal ?? '+0%'} vs mes anterior`}    icon={Landmark}       color="blue"          areaData={evolucionFiltrada} />
          <StatCard title="Cartera vencida"      value={formatMillones(stats.carteraVencida ?? 0)}   trend={`${stats.tendencias?.carteraVencida ?? '+0%'} vs mes anterior`}  icon={AlertCircle}    color="purple"  isBadTrend areaData={evolucionFiltrada} />
          <StatCard title="Cartera al día"       value={formatMillones(stats.carteraAlDia ?? 0)}     trend={`${stats.tendencias?.carteraAlDia ?? '+0%'} vs mes anterior`}    icon={CircleCheckBig} color="emerald"       areaData={evolucionFiltrada} />
          <StatCard title="Recuperación del mes" value={formatMillones(stats.recuperacionMes ?? 0)}  trend={`${stats.tendencias?.recuperacionMes ?? '+0%'} vs mes anterior`} icon={BarChart3}      color="indigo"        areaData={evolucionFiltrada} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 xl:col-span-5 glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">Distribución de cartera</h3>
              <Info size={14} className="text-slate-400" />
            </div>
          </div>

          <div className="space-y-5">
            {distribucion.length === 0 && (
              <p className="text-xs text-slate-400 font-medium">Aún no hay distribución de cartera disponible.</p>
            )}
            {distribucion.map((item) => {
              const categoria = item?.categoria;
              const porcentaje = item?.porcentaje ?? 0;
              const monto = item?.monto ?? 0;
              const s = (categoria && CAT_STYLES[categoria]) ?? CAT_STYLES.A;
              return (
                <div key={categoria ?? Math.random()} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                    <s.Icon size={18} className={s.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">
                      <span className="font-bold mr-1.5 text-slate-700">{categoria ?? '—'}</span>{categoria ? calificacionLabel(categoria) : ''}
                    </p>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${porcentaje}%`, backgroundColor: s.bar }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 shrink-0 w-32 text-right" title={formatMillones(monto)}>
                    {formatMillones(monto)}
                  </span>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 w-14 text-center ${s.badgeBg} ${s.badgeText}`}>
                    {formatPorcentaje(porcentaje)}
                  </div>
                </div>
              );
            })}
          </div>

          {stats && (
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <PieIcon size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Cartera total</p>
                  <p className="text-sm font-bold text-slate-800">{formatMillones(stats.carteraTotal ?? 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Variación vs mes anterior</p>
                  <p className="text-sm font-bold text-emerald-500">{stats.tendencias?.carteraTotal ?? '+0%'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-12 xl:col-span-7 glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold">Evolución de recuperación</h3>
            <div className="relative">
              <select
                value={evolucionMeses}
                onChange={(e) => setEvolucionMeses(Number(e.target.value) as EvolucionMeses)}
                className="appearance-none pr-8 pl-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/30"
              >
                <option value={12}>Últimos 12 meses</option>
                <option value={6}>Últimos 6 meses</option>
                <option value={3}>Últimos 3 meses</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
            </div>
          </div>
          <div className="h-[260px] w-full">
            {evolucionFiltrada.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-medium text-slate-400">
                Aún no hay datos de recuperación disponibles.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucionFiltrada}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="fecha"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    tickFormatter={formatFechaCorta}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    tickFormatter={(v: number) => formatMillones(v)}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold' }}
                    labelFormatter={(label) => formatFechaCorta(String(label))}
                    formatter={(value) => [formatMillones(Number(value)), 'Recuperado']}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  icon: typeof Landmark;
  color: 'blue' | 'indigo' | 'purple' | 'emerald';
  isBadTrend?: boolean;
  areaData: EvolucionRecuperacionItem[];
}

function StatCard({ title, value, trend, icon: Icon, color, isBadTrend, areaData }: StatCardProps) {
  const colorMap: Record<string, { icon: string; value: string; stroke: string }> = {
    blue:    { icon: 'bg-blue-50 text-blue-500',       value: 'text-blue-600',    stroke: '#3B82F6' },
    indigo:  { icon: 'bg-indigo-50 text-indigo-500',   value: 'text-indigo-600',  stroke: '#6366f1' },
    purple:  { icon: 'bg-purple-50 text-purple-500',   value: 'text-purple-600',  stroke: '#a855f7' },
    emerald: { icon: 'bg-emerald-50 text-emerald-500', value: 'text-emerald-600', stroke: '#10b981' },
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${c.icon} shrink-0 transition-transform group-hover:scale-110`}>
          <Icon size={24} />
        </div>
        <div className="w-12 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <Area type="monotone" dataKey="valor" stroke={c.stroke} fill="none" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-none mb-2">{title}</p>
        <p className={`text-2xl font-bold tracking-tight mb-1 ${c.value}`}>{value}</p>
        <div className="flex items-center gap-1.5">
          {isBadTrend
            ? <TrendingUp size={14} className="text-red-400 rotate-180" />
            : <TrendingUp size={14} className="text-emerald-500" />}
          <span className={`text-[10px] font-bold ${isBadTrend ? 'text-red-400' : 'text-emerald-500'}`}>{trend}</span>
        </div>
      </div>
    </div>
  );
}
