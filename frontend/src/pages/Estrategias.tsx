import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Sparkles, Search, Target, ShieldAlert, TrendingUp, ShieldCheck,
  X, Wand2, BadgeCheck, Clock, AlertTriangle, CreditCard,
  Filter, ChevronDown, Download,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  MOCK_PERFILAMIENTO,
  MOCK_RECUPERACION,
  type ClientePerfilamiento,
  type ClienteRecuperacion,
  type NivelAfinidad,
  type NivelRiesgo,
} from '../data/estrategiasMock';
import { GrupoRiesgo, type ColumnaTabla } from '../components/estrategias/GrupoRiesgo';
import {
  exportarPerfilamiento,
  exportarRecuperacion,
  exportarTodo,
} from '../components/estrategias/exportar';

type Seccion = 'perfilamiento' | 'recuperacion';

// ── Helpers ──────────────────────────────────────────────
const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const AFINIDAD_BADGE: Record<NivelAfinidad, { bg: string; text: string; dot: string }> = {
  Alto:  { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  Medio: { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500' },
  Bajo:  { bg: 'bg-slate-100',  text: 'text-slate-500',   dot: 'bg-slate-400' },
};

const RIESGO_BADGE: Record<NivelRiesgo, { bg: string; text: string; dot: string }> = {
  Bajo:  { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  Medio: { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500' },
  Alto:  { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500' },
};

const NIVELES_AFINIDAD: NivelAfinidad[] = ['Alto', 'Medio', 'Bajo'];
const NIVELES_RIESGO: NivelRiesgo[] = ['Alto', 'Medio', 'Bajo'];

// ── Componente principal ─────────────────────────────────
export function Estrategias() {
  const [seccion, setSeccion] = useState<Seccion>('perfilamiento');
  const [search, setSearch] = useState('');
  const [estrategiaAbierta, setEstrategiaAbierta] = useState<{
    titulo: string;
    subtitulo: string;
    texto: string;
  } | null>(null);

  const perfilados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_PERFILAMIENTO;
    return MOCK_PERFILAMIENTO.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.perfil.toLowerCase().includes(q) ||
        c.productoSugerido.toLowerCase().includes(q),
    );
  }, [search]);

  const recuperacion = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_RECUPERACION;
    return MOCK_RECUPERACION.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.comportamientoPago.toLowerCase().includes(q),
    );
  }, [search]);

  const porNivelPerfilamiento = useMemo(() => {
    const map: Record<NivelAfinidad, ClientePerfilamiento[]> = { Alto: [], Medio: [], Bajo: [] };
    for (const c of perfilados) map[c.nivelAfinidad].push(c);
    return map;
  }, [perfilados]);

  const porNivelRecuperacion = useMemo(() => {
    const map: Record<NivelRiesgo, ClienteRecuperacion[]> = { Alto: [], Medio: [], Bajo: [] };
    for (const c of recuperacion) map[c.nivelRiesgo].push(c);
    return map;
  }, [recuperacion]);

  const stats = useMemo(() => ({
    perfilamientoAlto: MOCK_PERFILAMIENTO.filter((c) => c.nivelAfinidad === 'Alto').length,
    perfilamientoTotal: MOCK_PERFILAMIENTO.length,
    recuperacionAlto: MOCK_RECUPERACION.filter((c) => c.nivelRiesgo === 'Alto').length,
    recuperacionTotal: MOCK_RECUPERACION.length,
    montoEnRiesgo: MOCK_RECUPERACION.reduce((acc, c) => acc + c.montoVencido, 0),
  }), []);

  // Columnas para cada sección
  const columnasPerfilamiento: ColumnaTabla<ClientePerfilamiento>[] = [
    {
      key: 'cliente',
      label: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar nombre={c.nombre} />
          <div>
            <p className="text-xs font-bold text-navy-dark leading-tight">{c.nombre}</p>
            <p className="text-[10px] text-slate-400 font-medium">P-{String(c.id).padStart(4, '0')}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'perfil',
      label: 'Comportamiento',
      render: (c) => (
        <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
          <BadgeCheck size={12} className="text-emerald-500 shrink-0" />
          <span className="truncate">{c.perfil}</span>
        </p>
      ),
    },
    {
      key: 'producto',
      label: 'Producto sugerido',
      render: (c) => <p className="text-xs font-bold text-navy-dark">{c.productoSugerido}</p>,
    },
    {
      key: 'match',
      label: 'Match',
      align: 'right',
      render: (c) => (
        <div className="inline-flex flex-col items-end">
          <span className="text-sm font-extrabold text-[#006875]">{c.afinidad}%</span>
          <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00b4d8] to-[#00e5ff]"
              style={{ width: `${c.afinidad}%` }}
            />
          </div>
        </div>
      ),
    },
  ];

  const columnasRecuperacion: ColumnaTabla<ClienteRecuperacion>[] = [
    {
      key: 'cliente',
      label: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar nombre={c.nombre} />
          <div>
            <p className="text-xs font-bold text-navy-dark leading-tight">{c.nombre}</p>
            <p className="text-[10px] text-slate-400 font-medium">R-{String(c.id).padStart(4, '0')}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'comportamiento',
      label: 'Comportamiento',
      render: (c) => (
        <p className="text-[11px] text-slate-600 font-medium truncate max-w-[280px]">{c.comportamientoPago}</p>
      ),
    },
    {
      key: 'mora',
      label: 'Días mora',
      align: 'right',
      render: (c) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-navy-dark">
          <Clock size={11} className="text-slate-400" /> {c.diasMora}d
        </span>
      ),
    },
    {
      key: 'monto',
      label: 'Monto vencido',
      align: 'right',
      render: (c) => <span className="text-xs font-bold text-navy-dark">{formatCOP(c.montoVencido)}</span>,
    },
    {
      key: 'riesgo',
      label: 'Riesgo',
      render: (c) => {
        const b = RIESGO_BADGE[c.nivelRiesgo];
        const Icon = c.nivelRiesgo === 'Alto' ? AlertTriangle : c.nivelRiesgo === 'Medio' ? TrendingUp : ShieldCheck;
        return (
          <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest', b.bg, b.text)}>
            <Icon size={10} /> {c.nivelRiesgo}
          </span>
        );
      },
    },
  ];

  const abrirEstrategiaPerfilamiento = (c: ClientePerfilamiento) =>
    setEstrategiaAbierta({
      titulo: c.nombre,
      subtitulo: `Producto sugerido: ${c.productoSugerido}`,
      texto: c.estrategia,
    });
  const abrirEstrategiaRecuperacion = (c: ClienteRecuperacion) =>
    setEstrategiaAbierta({
      titulo: c.nombre,
      subtitulo: `${c.diasMora} días de mora · ${formatCOP(c.montoVencido)} vencidos`,
      texto: c.estrategia,
    });

  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-navy-dark">Estrategias</h2>
            <Sparkles className="text-indigo-500 w-5 h-5" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Recomendaciones generadas por IA, agrupadas por perfil de riesgo para gestión a gran escala.
          </p>
        </div>
        <GenerarMenu
          onExportarTodo={() => exportarTodo(MOCK_PERFILAMIENTO, MOCK_RECUPERACION)}
        />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox
          label="Oportunidades de oferta"
          value={`${stats.perfilamientoAlto}/${stats.perfilamientoTotal}`}
          sub="clientes con afinidad alta"
          Icon={Target}
          bg="bg-cyan-50"
          color="text-cyan-500"
        />
        <StatBox
          label="Cuentas a recuperar"
          value={String(stats.recuperacionTotal)}
          sub={`${stats.recuperacionAlto} en alto riesgo`}
          Icon={ShieldAlert}
          bg="bg-red-50"
          color="text-red-500"
        />
        <StatBox
          label="Monto vencido total"
          value={formatCOP(stats.montoEnRiesgo)}
          sub="cartera bajo gestión IA"
          Icon={CreditCard}
          bg="bg-amber-50"
          color="text-amber-500"
        />
        <StatBox
          label="Estrategias generadas"
          value={String(MOCK_PERFILAMIENTO.length + MOCK_RECUPERACION.length)}
          sub="por el agente IA hoy"
          Icon={Sparkles}
          bg="bg-indigo-50"
          color="text-indigo-500"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <SectionTab
            active={seccion === 'perfilamiento'}
            onClick={() => setSeccion('perfilamiento')}
            Icon={Target}
            label="Perfilamiento"
          />
          <SectionTab
            active={seccion === 'recuperacion'}
            onClick={() => setSeccion('recuperacion')}
            Icon={ShieldAlert}
            label="Recuperación de cartera"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:border-slate-300 transition-colors">
            <Filter size={14} /> Filtrar
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 w-64"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {seccion === 'perfilamiento'
          ? NIVELES_AFINIDAD.map((nivel) => {
              const b = AFINIDAD_BADGE[nivel];
              const clientesNivel = porNivelPerfilamiento[nivel];
              return (
                <GrupoRiesgo
                  key={`perf-${nivel}`}
                  nivel={nivel}
                  colorBadge={`${b.bg} ${b.text}`}
                  colorIndicador={b.dot}
                  clientes={clientesNivel}
                  columnas={columnasPerfilamiento}
                  initiallyExpanded={nivel === 'Alto'}
                  onVerEstrategia={abrirEstrategiaPerfilamiento}
                  onExportarGrupo={(list) => exportarPerfilamiento(list, `grupo-${nivel.toLowerCase()}`)}
                  onExportarSeleccionados={(list) => exportarPerfilamiento(list, `seleccion-${nivel.toLowerCase()}`)}
                />
              );
            })
          : NIVELES_RIESGO.map((nivel) => {
              const b = RIESGO_BADGE[nivel];
              const clientesNivel = porNivelRecuperacion[nivel];
              return (
                <GrupoRiesgo
                  key={`rec-${nivel}`}
                  nivel={nivel}
                  colorBadge={`${b.bg} ${b.text}`}
                  colorIndicador={b.dot}
                  clientes={clientesNivel}
                  columnas={columnasRecuperacion}
                  initiallyExpanded={nivel === 'Alto'}
                  onVerEstrategia={abrirEstrategiaRecuperacion}
                  onExportarGrupo={(list) => exportarRecuperacion(list, `grupo-${nivel.toLowerCase()}`)}
                  onExportarSeleccionados={(list) => exportarRecuperacion(list, `seleccion-${nivel.toLowerCase()}`)}
                />
              );
            })}
      </div>

      {estrategiaAbierta && (
        <EstrategiaModal
          titulo={estrategiaAbierta.titulo}
          subtitulo={estrategiaAbierta.subtitulo}
          texto={estrategiaAbierta.texto}
          onClose={() => setEstrategiaAbierta(null)}
        />
      )}
    </div>
  );
}

// ── Subcomponentes ───────────────────────────────────────
function SectionTab({
  active, onClick, Icon, label,
}: {
  active: boolean; onClick: () => void; Icon: typeof Target; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all',
        active ? 'bg-white text-navy-dark shadow-sm' : 'text-slate-400 hover:text-slate-600',
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function GenerarMenu({ onExportarTodo }: { onExportarTodo: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div className="flex">
        <button className="flex items-center gap-2 bg-[#006875] text-white pl-5 pr-4 py-3 rounded-l-xl font-bold shadow-lg hover:bg-[#004f58] transition-all">
          <Wand2 size={18} /> Generar nuevas
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Más opciones"
          className="bg-[#006875] text-white px-3 py-3 rounded-r-xl shadow-lg border-l border-white/20 hover:bg-[#004f58] transition-all"
        >
          <ChevronDown size={16} className={clsx('transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-30">
          <button
            onClick={() => { setOpen(false); onExportarTodo(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download size={14} className="text-[#006875]" /> Exportar todo (.xlsx)
          </button>
        </div>
      )}
    </div>
  );
}

function EstrategiaModal({
  titulo, subtitulo, texto, onClose,
}: {
  titulo: string; subtitulo: string; texto: string; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shrink-0">
              <Wand2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Estrategia IA</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-navy-dark leading-tight">{titulo}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">{subtitulo}</p>
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

        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">{texto}</p>
        </div>

        <footer className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
          <button className="flex items-center gap-2 bg-[#006875] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#004f58] transition-all">
            <Sparkles size={14} /> Aplicar estrategia
          </button>
        </footer>
      </div>
    </div>
  );
}

function StatBox({
  label, value, sub, Icon, bg, color,
}: {
  label: string; value: string; sub: string; Icon: typeof Target; bg: string; color: string;
}) {
  return (
    <div className="glass-card rounded-3xl p-6 flex items-center gap-5">
      <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm', bg, color)}>
        <Icon size={26} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-extrabold text-navy-dark leading-tight">{value}</p>
        <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>
      </div>
    </div>
  );
}

function Avatar({ nombre }: { nombre: string }) {
  const parts = nombre.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  const inits = (first + second).toUpperCase() || '?';
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00b4d8] to-[#00e5ff] text-navy-dark font-bold flex items-center justify-center shrink-0 text-[10px]">
      {inits}
    </div>
  );
}
