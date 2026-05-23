import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, ChevronRight, ChevronDown, Landmark, AlertCircle, CircleCheckBig,
  BarChart3, Wallet, Clock, CalendarDays, AlertTriangle, Info, Users, ShieldCheck,
  PieChart as PieIcon, Loader2, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  getStats,
  getDistribucionCartera,
  getEvolucionRecuperacion,
  getRiesgoDesercion,
} from '../services/dashboard';
import { getApiErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  formatCOPCompact,
  formatCOP,
  formatNumber,
  formatPorcentaje,
  formatFechaCorta,
  calificacionLabel,
} from '../utils/format';
import type {
  DashboardStats,
  DistribucionCarteraItem,
  EvolucionRecuperacionItem,
  RiesgoDesercion,
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
  riesgo: RiesgoDesercion;
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, distribucion, evolucion, riesgo] = await Promise.all([
        getStats(),
        getDistribucionCartera(),
        getEvolucionRecuperacion(),
        getRiesgoDesercion(),
      ]);
      setData({ stats, distribucion, evolucion, riesgo });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

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

  const { stats, distribucion, evolucion, riesgo } = data;

  return (
    <div className="space-y-8 pb-12">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-3xl font-bold tracking-tight">¡Hola, {firstName}! 👋</h2>
        </div>
        <p className="text-slate-500 text-sm font-medium">Este es el resumen general de la cartera y la gestión de hoy.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Cartera total"        value={formatCOPCompact(stats.carteraTotal)}     trend={`${stats.tendencias.carteraTotal} vs mes anterior`}    icon={Landmark}       color="blue"          areaData={evolucion} />
        <StatCard title="Cartera vencida"      value={formatCOPCompact(stats.carteraVencida)}   trend={`${stats.tendencias.carteraVencida} vs mes anterior`}  icon={AlertCircle}    color="purple"  isBadTrend areaData={evolucion} />
        <StatCard title="Cartera al día"       value={formatCOPCompact(stats.carteraAlDia)}     trend={`${stats.tendencias.carteraAlDia} vs mes anterior`}    icon={CircleCheckBig} color="emerald"       areaData={evolucion} />
        <StatCard title="Recuperación del mes" value={formatCOPCompact(stats.recuperacionMes)}  trend={`${stats.tendencias.recuperacionMes} vs mes anterior`} icon={BarChart3}      color="indigo"        areaData={evolucion} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 xl:col-span-5 glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">Distribución de cartera</h3>
              <Info size={14} className="text-slate-400" />
            </div>
            <button className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              Último corte <ChevronDown size={14} />
            </button>
          </div>

          <div className="space-y-5">
            {distribucion.map((item) => {
              const s = CAT_STYLES[item.categoria] ?? CAT_STYLES.A;
              return (
                <div key={item.categoria} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                    <s.Icon size={18} className={s.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">
                      <span className="font-bold mr-1.5 text-slate-700">{item.categoria}</span>{calificacionLabel(item.categoria)}
                    </p>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.porcentaje}%`, backgroundColor: s.bar }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 shrink-0 w-32 text-right" title={formatCOP(item.monto)}>
                    {formatCOPCompact(item.monto)}
                  </span>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 w-14 text-center ${s.badgeBg} ${s.badgeText}`}>
                    {formatPorcentaje(item.porcentaje)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <PieIcon size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Cartera total</p>
                <p className="text-sm font-bold text-slate-800">{formatCOP(stats.carteraTotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Variación vs mes anterior</p>
                <p className="text-sm font-bold text-emerald-500">{stats.tendencias.carteraTotal}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-7 glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold">Evolución de recuperación</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
              Últimos 12 meses <ChevronDown size={14} />
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucion}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
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
                  tickFormatter={(v: number) => formatCOPCompact(v)}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                  labelFormatter={(label) => formatFechaCorta(String(label))}
                  formatter={(value) => [formatCOP(Number(value)), 'Recuperado']}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#00e5ff"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Riesgo de deserción (IA)</h3>
              <Info size={15} className="text-slate-400" />
            </div>
            <button className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 hover:border-slate-300 transition-colors">
              <CalendarDays size={13} /> Este mes <ChevronDown size={13} />
            </button>
          </div>

          <RiesgoBody riesgo={riesgo} />

          <div className="border-t border-slate-100 my-6" />

          <div className="grid grid-cols-3 gap-4 mb-5">
            <BottomStat
              label="Total monitoreados"
              value={formatNumber(riesgo.totalMonitoreados)}
              sub="Créditos en el último corte"
              Icon={Users}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              valueColor="text-slate-900"
            />
            <BottomStat
              label="% Alto riesgo"
              value={formatPorcentaje(riesgo.altoRiesgo.porcentaje)}
              sub={`${riesgo.altoRiesgo.tendencia} vs corte anterior`}
              Icon={TrendingUp}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              valueColor={riesgo.altoRiesgo.tendencia.startsWith('+') ? 'text-red-500' : 'text-emerald-500'}
            />
            <BottomStat
              label="% Bajo riesgo"
              value={formatPorcentaje(riesgo.bajoRiesgo.porcentaje)}
              sub={`${riesgo.bajoRiesgo.tendencia} vs corte anterior`}
              Icon={ShieldCheck}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
              valueColor="text-emerald-500"
            />
          </div>

          <button className="w-full flex items-center justify-center gap-2 border border-[#006875] text-[#006875] rounded-2xl py-3 text-sm font-bold hover:bg-[#006875] hover:text-white transition-all">
            Ver estudiantes críticos <ChevronRight size={15} />
          </button>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="flex-1 bg-gradient-to-br from-indigo-900 to-navy-dark rounded-3xl p-8 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/10 blur-3xl -mr-12 -mt-12" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-[#00e5ff] font-bold text-xs mb-4 uppercase tracking-widest">
                Insight ✨
              </div>
              <p className="text-white text-[13px] leading-relaxed mb-6 font-medium">
                {riesgo.altoRiesgo.tendencia.startsWith('+')
                  ? `El alto riesgo subió ${riesgo.altoRiesgo.tendencia} respecto al corte anterior: ${formatNumber(riesgo.altoRiesgo.cantidad)} créditos requieren atención prioritaria.`
                  : `El alto riesgo bajó ${riesgo.altoRiesgo.tendencia}: ${formatNumber(riesgo.altoRiesgo.cantidad)} créditos siguen requiriendo seguimiento.`}
              </p>
              <button className="bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-[#00e5ff] hover:text-navy-dark transition-all">
                Ver recomendación
              </button>
            </div>
            <div className="mt-auto flex justify-end">
              <img src="/AURA_1.png" alt="AURA" className="w-24 h-24 object-contain drop-shadow-xl animate-float" />
            </div>
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

function RiesgoBody({ riesgo }: { riesgo: RiesgoDesercion }) {
  const riskChartData = [
    { name: 'Alto',  value: riesgo.altoRiesgo.cantidad,  color: '#a78bfa' },
    { name: 'Medio', value: riesgo.medioRiesgo.cantidad, color: '#818cf8' },
    { name: 'Bajo',  value: riesgo.bajoRiesgo.cantidad,  color: '#34d399' },
  ];

  const niveles = [
    {
      label: 'Alto riesgo',  desc: 'Mora > 120 días (calificación E)',
      nivel: riesgo.altoRiesgo, Icon: AlertTriangle,
      iconBg: 'bg-violet-50', iconColor: 'text-violet-500',
    },
    {
      label: 'Riesgo medio', desc: 'Mora 31-120 días (C, D)',
      nivel: riesgo.medioRiesgo, Icon: Users,
      iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
    },
    {
      label: 'Riesgo bajo',  desc: 'Al día o mora ≤ 30 días (A, B)',
      nivel: riesgo.bajoRiesgo, Icon: ShieldCheck,
      iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="flex gap-8 items-center">
      <div className="relative w-56 h-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={riskChartData} cx="50%" cy="50%" innerRadius={58} outerRadius={88}
              dataKey="value" startAngle={90} endAngle={-270} paddingAngle={3} strokeWidth={0}
            >
              {riskChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <Users size={18} className="text-slate-400 mb-1" />
          <span className="text-2xl font-bold text-slate-900 leading-none">{formatNumber(riesgo.totalMonitoreados)}</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 leading-tight">Créditos<br/>monitoreados</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {niveles.map((r) => {
          const isUp = r.nivel.tendencia.startsWith('+');
          const TrendIcon = isUp ? TrendingUp : TrendingDown;
          const trendColor = isUp ? 'text-red-500' : 'text-emerald-500';
          return (
            <div key={r.label} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.iconBg}`}>
                <r.Icon size={16} className={r.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800">{r.label}</p>
                <p className="text-[10px] text-slate-400 truncate">{r.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900">
                  {formatNumber(r.nivel.cantidad)}{' '}
                  <span className="text-slate-400 font-semibold text-xs">({formatPorcentaje(r.nivel.porcentaje)})</span>
                </p>
                <div className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${trendColor}`}>
                  <TrendIcon size={10} /> {r.nivel.tendencia}
                  <span className="text-slate-400 font-normal ml-0.5">vs corte ant.</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BottomStatProps {
  label: string; value: string; sub: string;
  Icon: typeof Users;
  iconBg: string; iconColor: string; valueColor: string;
}
function BottomStat({ label, value, sub, Icon, iconBg, iconColor, valueColor }: BottomStatProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={14} className={iconColor} />
      </div>
      <div>
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest leading-tight">{label}</p>
        <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
        <p className="text-[9px] text-slate-400">{sub}</p>
      </div>
    </div>
  );
}
