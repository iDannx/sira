import { TrendingUp, TrendingDown, ChevronRight, Landmark, AlertCircle, CircleCheckBig, BarChart3, Wallet, Clock, CalendarDays, AlertTriangle, Info, Users, ShieldCheck, PieChart as PieIcon } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const areaData = [
  { name: '01 May', value: 40 },
  { name: '08 May', value: 80 },
  { name: '15 May', value: 65 },
  { name: '22 May', value: 120 },
  { name: '31 May', value: 185 },
];

const distributionData = [
  { name: 'Al día',            amount: '519.300.000', pct: 50.7, bar: '#22c55e', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600', Icon: Wallet       },
  { name: 'Vencida 1-30 días', amount: '580.300.000', pct: 13.9, bar: '#f59e0b', iconBg: 'bg-amber-50',   iconColor: 'text-amber-500',   badgeBg: 'bg-amber-50',   badgeText: 'text-amber-600',   Icon: Clock        },
  { name: 'Vencida 31-90 días',amount: '165.300.000', pct: 19.1, bar: '#f87171', iconBg: 'bg-red-50',     iconColor: 'text-red-400',     badgeBg: 'bg-red-50',     badgeText: 'text-red-400',     Icon: CalendarDays },
  { name: 'Vencida > 90 días', amount: '674.300.000', pct: 16.3, bar: '#ef4444', iconBg: 'bg-red-50',     iconColor: 'text-red-500',     badgeBg: 'bg-red-50',     badgeText: 'text-red-500',     Icon: AlertTriangle},
];

const riskChartData = [
  { name: 'Alto',  value: 342, color: '#a78bfa' },
  { name: 'Medio', value: 538, color: '#818cf8' },
  { name: 'Bajo',  value: 367, color: '#34d399' },
];

const riskLevels = [
  {
    label: 'Alto riesgo',  desc: 'Estudiantes en riesgo crítico de deserción',
    count: '342', pct: '27%', trend: '+12%', trendColor: 'text-red-500',
    Icon: AlertTriangle, iconBg: 'bg-violet-50', iconColor: 'text-violet-500',
    TrendIcon: TrendingUp,
  },
  {
    label: 'Riesgo medio', desc: 'Estudiantes con factores de riesgo moderado',
    count: '538', pct: '43%', trend: '-5%',  trendColor: 'text-blue-500',
    Icon: Users,         iconBg: 'bg-blue-50',    iconColor: 'text-blue-500',
    TrendIcon: TrendingDown,
  },
  {
    label: 'Riesgo bajo',  desc: 'Estudiantes estables sin señales de riesgo',
    count: '367', pct: '30%', trend: '-3%',  trendColor: 'text-emerald-500',
    Icon: ShieldCheck,   iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500',
    TrendIcon: TrendingDown,
  },
];

const riskBottomStats = [
  { label: 'Total monitoreados',             value: '1.247', sub: '100% del universo activo',      Icon: Users,       iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',   valueColor: 'text-slate-900' },
  { label: 'Variación total vs mes anterior', value: '+8.4%', sub: 'Aumento en el riesgo general', Icon: TrendingUp,  iconBg: 'bg-red-50',    iconColor: 'text-red-500',    valueColor: 'text-red-500'   },
  { label: 'Tendencia del riesgo alto',       value: '+12%',  sub: 'Últimos 30 días',              Icon: BarChart3,   iconBg: 'bg-orange-50', iconColor: 'text-orange-500', valueColor: 'text-orange-500'},
];

export function Dashboard() {
  return (
    <div className="space-y-8 pb-12">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-3xl font-bold tracking-tight">¡Hola, María Fernanda! 👋</h2>
        </div>
        <p className="text-slate-500 text-sm font-medium">Este es el resumen general de la cartera y la gestión de hoy.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Cartera total"      value="$2.458B"   trend="+12.5% vs mes anterior" icon={Landmark}       color="blue"          />
        <StatCard title="Cartera vencida"    value="$612.45M"  trend="+8.3% vs mes anterior"  icon={AlertCircle}    color="purple"  isBadTrend />
        <StatCard title="Cartera al día"     value="$1.246B"   trend="+5.2% vs mes anterior"  icon={CircleCheckBig} color="emerald"       />
        <StatCard title="Recuperación del mes" value="$185.75M" trend="+18% vs mes anterior"  icon={BarChart3}      color="indigo"        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Distribution Chart */}
        <div className="lg:col-span-12 xl:col-span-5 glass-card rounded-3xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">Distribución de cartera</h3>
              <Info size={14} className="text-slate-400" />
            </div>
            <button className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              Este mes <ChevronDownIcon size={14} />
            </button>
          </div>

          {/* Rows */}
          <div className="space-y-5">
            {distributionData.map(({ name, amount, pct, bar, iconBg, iconColor, badgeBg, badgeText, Icon }) => (
              <div key={name} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon size={18} className={iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">{name}</p>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: bar }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700 shrink-0 w-28 text-right">$ {amount}</span>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 w-14 text-center ${badgeBg} ${badgeText}`}>
                  {pct}%
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <PieIcon size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Cartera total</p>
                <p className="text-sm font-bold text-slate-800">$ 2.458.750.000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Variación vs mes anterior</p>
                <p className="text-sm font-bold text-emerald-500">↑ +12.5%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Evolution Chart */}
        <div className="lg:col-span-12 xl:col-span-7 glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold">Evolución de recuperación</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
              Este mes <ChevronDownIcon size={14} />
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  tickFormatter={(val) => `${val}M`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
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
        {/* Riesgo de Deserción — nuevo diseño */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Riesgo de deserción (IA)</h3>
              <Info size={15} className="text-slate-400" />
            </div>
            <button className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 hover:border-slate-300 transition-colors">
              <CalendarDays size={13} /> Este mes <ChevronDownIcon size={13} />
            </button>
          </div>

          {/* Cuerpo */}
          <div className="flex gap-8 items-center">
            {/* Donut */}
            <div className="relative w-56 h-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskChartData} cx="50%" cy="50%" innerRadius={58} outerRadius={88}
                    dataKey="value" startAngle={90} endAngle={-270} paddingAngle={3} strokeWidth={0}>
                    {riskChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <Users size={18} className="text-slate-400 mb-1" />
                <span className="text-2xl font-bold text-slate-900 leading-none">1.247</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 leading-tight">Estudiantes<br/>monitoreados</span>
              </div>
            </div>

            {/* Niveles + programa */}
            <div className="flex-1 flex flex-col gap-4">
              {riskLevels.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.iconBg}`}>
                    <r.Icon size={16} className={r.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{r.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">{r.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{r.count} <span className="text-slate-400 font-semibold text-xs">({r.pct})</span></p>
                    <div className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${r.trendColor}`}>
                      <r.TrendIcon size={10} /> {r.trend}
                      <span className="text-slate-400 font-normal ml-0.5">vs mes anterior</span>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-slate-100 my-6" />

          {/* Stats inferiores */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {riskBottomStats.map((s) => (
              <div key={s.label} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  <s.Icon size={14} className={s.iconColor} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest leading-tight">{s.label}</p>
                  <p className={`text-sm font-bold ${s.valueColor}`}>{s.value}</p>
                  <p className="text-[9px] text-slate-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button className="w-full flex items-center justify-center gap-2 border border-[#006875] text-[#006875] rounded-2xl py-3 text-sm font-bold hover:bg-[#006875] hover:text-white transition-all">
            Ver estudiantes críticos <ChevronRight size={15} />
          </button>
        </div>


{/* AI Insight Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           <div className="flex-1 bg-gradient-to-br from-indigo-900 to-navy-dark rounded-3xl p-8 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/10 blur-3xl -mr-12 -mt-12" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-[#00e5ff] font-bold text-xs mb-4 uppercase tracking-widest">
                  Notificación de AURA ✨
                </div>
                <p className="text-white text-[13px] leading-relaxed mb-6 font-medium">
                  He detectado un aumento del 18% en la cartera vencida &gt; 90 días con respecto al mes anterior en el programa de Ingeniería Industrial.
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

function StatCard({ title, value, trend, icon: Icon, color, isBadTrend }: any) {
  const colorMap: any = {
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
              <Area type="monotone" dataKey="value" stroke={c.stroke} fill="none" strokeWidth={2} />
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

function ChevronDownIcon({ size }: { size: number }) {
  return <ChevronDown size={size} />;
}

function ChevronDown({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
}
