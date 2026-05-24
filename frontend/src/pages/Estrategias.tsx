import { useMemo, useState } from 'react';
import {
  Sparkles, Search, Target, ShieldAlert, TrendingUp, ShieldCheck,
  Users, X, Wand2, BadgeCheck, Clock, AlertTriangle, CreditCard,
  ChevronRight, Filter,
} from 'lucide-react';
import { clsx } from 'clsx';

// ── Tipos ────────────────────────────────────────────────
type NivelAfinidad = 'Alto' | 'Medio' | 'Bajo';
type NivelRiesgo = 'Bajo' | 'Medio' | 'Alto';

interface ClientePerfilamiento {
  id: number;
  nombre: string;
  perfil: string;
  productoSugerido: string;
  afinidad: number; // 0-100
  nivelAfinidad: NivelAfinidad;
  estrategia: string;
}

interface ClienteRecuperacion {
  id: number;
  nombre: string;
  diasMora: number;
  nivelRiesgo: NivelRiesgo;
  comportamientoPago: string;
  montoVencido: number;
  estrategia: string;
}

type Seccion = 'perfilamiento' | 'recuperacion';

// ── Datos mock ───────────────────────────────────────────
const MOCK_PERFILAMIENTO: ClientePerfilamiento[] = [
  {
    id: 1,
    nombre: 'María Camila Rojas',
    perfil: 'Pagador puntual · 18 meses sin mora',
    productoSugerido: 'Compra de cartera',
    afinidad: 92,
    nivelAfinidad: 'Alto',
    estrategia:
      'María Camila ha mantenido pagos puntuales durante 18 meses consecutivos y muestra una capacidad de endeudamiento subutilizada del 35%. Se recomienda ofrecer una compra de cartera que consolide sus créditos externos (tarjeta de crédito Banco X por $4.200.000 y libranza por $6.800.000) bajo una tasa preferencial del 1.4% MV. La oferta debe enviarse por WhatsApp con simulación previa y opción de aceptación en línea. Estimación de ahorro mensual al cliente: $128.000.',
  },
  {
    id: 2,
    nombre: 'Andrés Felipe Gómez',
    perfil: 'Alta capacidad de endeudamiento · Score 780',
    productoSugerido: 'Crédito de libre inversión',
    afinidad: 88,
    nivelAfinidad: 'Alto',
    estrategia:
      'Andrés presenta un score crediticio de 780, ingresos estables verificados por Open Finance y un nivel de endeudamiento del 22%. Se sugiere ofrecer crédito de libre inversión hasta $25.000.000 a 60 meses, con tasa del 1.65% MV. El canal recomendado es correo electrónico con landing personalizada. Mensaje sugerido: "Has demostrado un manejo financiero excelente — desbloqueamos un cupo preaprobado pensado para tus próximos planes".',
  },
  {
    id: 3,
    nombre: 'Laura Stefanía Pérez',
    perfil: 'Cliente recurrente · Bajo endeudamiento',
    productoSugerido: 'Aumento de cupo',
    afinidad: 76,
    nivelAfinidad: 'Medio',
    estrategia:
      'Laura tiene 3 productos activos, todos al día, y usa menos del 40% de su cupo actual de tarjeta. Recomendamos aumento de cupo del 50% ($1.500.000 → $2.250.000). Importante: enviar notificación informativa, no oferta de venta agresiva — su perfil responde mejor a comunicaciones suaves y orientadas a beneficio personal.',
  },
  {
    id: 4,
    nombre: 'Juan Sebastián Morales',
    perfil: 'Pagador puntual · Nicho juvenil',
    productoSugerido: 'Crédito educativo',
    afinidad: 81,
    nivelAfinidad: 'Alto',
    estrategia:
      'Perfil de 22 años, estudiante universitario en último semestre con apoyo familiar. Tiene microcrédito vigente sin mora. Se sugiere ofrecer crédito educativo de hasta $8.000.000 para posgrado o especialización, con periodo de gracia de 12 meses post-graduación. Canal recomendado: WhatsApp Business con material gráfico breve, lenguaje cercano.',
  },
  {
    id: 5,
    nombre: 'Diana Patricia Vega',
    perfil: 'Cliente premium · Score 820',
    productoSugerido: 'Tarjeta de crédito Gold',
    afinidad: 95,
    nivelAfinidad: 'Alto',
    estrategia:
      'Diana cumple todos los criterios para upgrade a tarjeta Gold: ingresos superiores a $8M mensuales, 5+ años de relación, sin mora histórica. Beneficios sugeridos a comunicar: cashback del 2%, sala VIP en aeropuertos, seguro de viaje. Enviar oferta personalizada por correo + llamada de bienvenida del gestor asignado.',
  },
  {
    id: 6,
    nombre: 'Carlos Eduardo Niño',
    perfil: 'Capacidad media · Buen historial',
    productoSugerido: 'Crédito de vehículo',
    afinidad: 68,
    nivelAfinidad: 'Medio',
    estrategia:
      'Carlos ha mostrado interés en simuladores de crédito vehicular en los últimos 30 días (3 visitas al simulador web). Score y capacidad lo califican para crédito hasta $45M a 60 meses. Activar campaña de retargeting + llamada del asesor en franja 6-8pm (preferencia detectada por horarios de interacción digital).',
  },
];

const MOCK_RECUPERACION: ClienteRecuperacion[] = [
  {
    id: 1,
    nombre: 'Pedro Antonio Salas',
    diasMora: 15,
    nivelRiesgo: 'Bajo',
    comportamientoPago: 'Suele atrasarse 1-2 semanas, paga sin gestión intensiva',
    montoVencido: 850000,
    estrategia:
      'Mora temprana en perfil históricamente recuperable. Acción sugerida: WhatsApp empático automatizado en día 16 ("Hola Pedro, vimos que tu cuota de $850.000 está pendiente — ¿te ayudamos a coordinar el pago?"). NO escalar a llamada todavía. Si no responde en 72h, segundo mensaje con opción de fraccionamiento. Probabilidad de pago sin gestión humana: 78%.',
  },
  {
    id: 2,
    nombre: 'Sandra Milena Vargas',
    diasMora: 45,
    nivelRiesgo: 'Medio',
    comportamientoPago: 'Mora recurrente pero negocia y cumple acuerdos',
    montoVencido: 2400000,
    estrategia:
      'Sandra responde bien a acuerdos personalizados, no a presión. Estrategia: llamada de la gestora Catalina Ríos (relación previa positiva) entre 10am-12pm. Ofrecer plan de pago en 3 cuotas con primera cuota condonando intereses moratorios. Riesgo de deserción si se aplica presión excesiva: ALTO. Cliente con 4 años de relación, vale la pena conservarlo.',
  },
  {
    id: 3,
    nombre: 'Ricardo Andrés Lozano',
    diasMora: 95,
    nivelRiesgo: 'Alto',
    comportamientoPago: 'Mora prolongada, evita contacto telefónico',
    montoVencido: 5800000,
    estrategia:
      'Caso crítico cerca del umbral jurídico. Cliente evade llamadas (8 intentos fallidos en últimos 30 días) pero responde correo electrónico. Acción: correo formal del jefe de cartera proponiendo reunión presencial o videollamada para acuerdo de pago. Ofrecer descuento del 40% en intereses moratorios si paga capital en 30 días. Si no hay respuesta en 7 días → traslado a área jurídica.',
  },
  {
    id: 4,
    nombre: 'Marcela Hernández Ruiz',
    diasMora: 8,
    nivelRiesgo: 'Bajo',
    comportamientoPago: 'Primera mora en 2 años, probable olvido',
    montoVencido: 320000,
    estrategia:
      'Atípico para este perfil. Probable causa: olvido o problema temporal (no patrón de mora). Acción suave: notificación amistosa automática por SMS y WhatsApp recordando vencimiento + link de pago en 1 clic. Evitar tono cobratorio para no dañar relación. Probabilidad de pago en 48h: 92%.',
  },
  {
    id: 5,
    nombre: 'Jorge Luis Mendoza',
    diasMora: 62,
    nivelRiesgo: 'Medio',
    comportamientoPago: 'Inestable, alterna meses al día con moras de 30-90 días',
    montoVencido: 3150000,
    estrategia:
      'Patrón inestable. Probable problema de flujo de caja (cliente independiente, ingresos variables). Proponer cambio de fecha de cuota al día 15 (post quincena) y plan de fraccionamiento de la mora actual en 4 cuotas pequeñas. Gestión por llamada matutina + seguimiento por WhatsApp.',
  },
  {
    id: 6,
    nombre: 'Patricia Ortega Suárez',
    diasMora: 130,
    nivelRiesgo: 'Alto',
    comportamientoPago: 'Sin respuesta en últimos 60 días, riesgo de castigo',
    montoVencido: 7900000,
    estrategia:
      'Cuenta en zona pre-castigo. Última oportunidad antes de reporte juridico: oferta de pago único con 60% de descuento sobre intereses moratorios y plan de 6 cuotas para el capital. Carta certificada física al domicilio registrado + correo + intento de contacto vía referencia familiar registrada. Si no hay respuesta en 15 días: castigar y enviar a abogados externos.',
  },
];

// ── Helpers ──────────────────────────────────────────────
const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const AFINIDAD_BADGE: Record<NivelAfinidad, { bg: string; text: string }> = {
  Alto:  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  Medio: { bg: 'bg-amber-50',   text: 'text-amber-600' },
  Bajo:  { bg: 'bg-slate-100',  text: 'text-slate-500' },
};

const RIESGO_STYLE: Record<NivelRiesgo, {
  badgeBg: string; badgeText: string; barColor: string; iconBg: string; iconColor: string;
}> = {
  Bajo:  { badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-600', barColor: 'bg-emerald-400', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  Medio: { badgeBg: 'bg-amber-50',   badgeText: 'text-amber-600',   barColor: 'bg-amber-400',   iconBg: 'bg-amber-50',   iconColor: 'text-amber-500' },
  Alto:  { badgeBg: 'bg-red-50',     badgeText: 'text-red-600',     barColor: 'bg-red-400',     iconBg: 'bg-red-50',     iconColor: 'text-red-500' },
};

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

  const stats = useMemo(() => ({
    perfilamientoAlto: MOCK_PERFILAMIENTO.filter((c) => c.nivelAfinidad === 'Alto').length,
    perfilamientoTotal: MOCK_PERFILAMIENTO.length,
    recuperacionAlto: MOCK_RECUPERACION.filter((c) => c.nivelRiesgo === 'Alto').length,
    recuperacionTotal: MOCK_RECUPERACION.length,
    montoEnRiesgo: MOCK_RECUPERACION.reduce((acc, c) => acc + c.montoVencido, 0),
  }), []);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-bold tracking-tight text-navy-dark">Estrategias</h2>
            <Sparkles className="text-indigo-500 w-5 h-5" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Recomendaciones generadas por IA para ofrecer productos a clientes ideales y diseñar la mejor ruta de recuperación de cartera vencida.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#006875] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#004f58] transition-all">
          <Wand2 size={18} />
          <span>Generar nuevas</span>
        </button>
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

      {seccion === 'perfilamiento' ? (
        <SeccionPerfilamiento
          clientes={perfilados}
          onVerEstrategia={(c) =>
            setEstrategiaAbierta({
              titulo: c.nombre,
              subtitulo: `Producto sugerido: ${c.productoSugerido}`,
              texto: c.estrategia,
            })
          }
        />
      ) : (
        <SeccionRecuperacion
          clientes={recuperacion}
          onVerEstrategia={(c) =>
            setEstrategiaAbierta({
              titulo: c.nombre,
              subtitulo: `${c.diasMora} días de mora · ${formatCOP(c.montoVencido)} vencidos`,
              texto: c.estrategia,
            })
          }
        />
      )}

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

function SeccionPerfilamiento({
  clientes, onVerEstrategia,
}: {
  clientes: ClientePerfilamiento[];
  onVerEstrategia: (c: ClientePerfilamiento) => void;
}) {
  if (clientes.length === 0) {
    return <EmptyState label="No hay clientes que coincidan con la búsqueda." Icon={Users} />;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {clientes.map((c) => {
        const badge = AFINIDAD_BADGE[c.nivelAfinidad];
        return (
          <article key={c.id} className="glass-card rounded-3xl p-6 flex flex-col gap-5 hover:shadow-lg transition-shadow">
            <header className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00b4d8] to-[#00e5ff] text-navy-dark font-bold flex items-center justify-center shrink-0 text-xs">
                  {initials(c.nombre)}
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-dark leading-tight">{c.nombre}</p>
                  <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    <BadgeCheck size={12} /> {c.perfil}
                  </p>
                </div>
              </div>
              <span className={clsx('px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0', badge.bg, badge.text)}>
                {c.nivelAfinidad}
              </span>
            </header>

            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Producto sugerido</p>
              <p className="text-sm font-bold text-navy-dark">{c.productoSugerido}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Match con el producto</p>
                <p className="text-sm font-extrabold text-[#006875]">{c.afinidad}%</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00b4d8] to-[#00e5ff]"
                  style={{ width: `${c.afinidad}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => onVerEstrategia(c)}
              className="w-full flex items-center justify-center gap-2 border border-[#006875] text-[#006875] rounded-2xl py-2.5 text-xs font-bold hover:bg-[#006875] hover:text-white transition-all"
            >
              Ver estrategia <ChevronRight size={14} />
            </button>
          </article>
        );
      })}
    </div>
  );
}

function SeccionRecuperacion({
  clientes, onVerEstrategia,
}: {
  clientes: ClienteRecuperacion[];
  onVerEstrategia: (c: ClienteRecuperacion) => void;
}) {
  if (clientes.length === 0) {
    return <EmptyState label="No hay clientes que coincidan con la búsqueda." Icon={Users} />;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {clientes.map((c) => {
        const s = RIESGO_STYLE[c.nivelRiesgo];
        const RiesgoIcon =
          c.nivelRiesgo === 'Alto' ? AlertTriangle :
          c.nivelRiesgo === 'Medio' ? TrendingUp : ShieldCheck;
        return (
          <article key={c.id} className="glass-card rounded-3xl p-6 flex flex-col gap-5 hover:shadow-lg transition-shadow">
            <header className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', s.iconBg)}>
                  <RiesgoIcon size={20} className={s.iconColor} />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-dark leading-tight">{c.nombre}</p>
                  <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    <Clock size={12} /> {c.diasMora} días de mora
                  </p>
                </div>
              </div>
              <span className={clsx('px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0', s.badgeBg, s.badgeText)}>
                Riesgo {c.nivelRiesgo}
              </span>
            </header>

            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Comportamiento de pago</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{c.comportamientoPago}</p>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monto vencido</p>
                <p className="text-lg font-extrabold text-navy-dark">{formatCOP(c.montoVencido)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Severidad</p>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => {
                    const filled =
                      (c.nivelRiesgo === 'Bajo' && i === 1) ||
                      (c.nivelRiesgo === 'Medio' && i <= 2) ||
                      (c.nivelRiesgo === 'Alto' && i <= 3);
                    return (
                      <span
                        key={i}
                        className={clsx(
                          'w-5 h-1.5 rounded-full',
                          filled ? s.barColor : 'bg-slate-200',
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => onVerEstrategia(c)}
              className="w-full flex items-center justify-center gap-2 border border-[#006875] text-[#006875] rounded-2xl py-2.5 text-xs font-bold hover:bg-[#006875] hover:text-white transition-all"
            >
              Ver estrategia <ChevronRight size={14} />
            </button>
          </article>
        );
      })}
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

function EmptyState({ label, Icon }: { label: string; Icon: typeof Users }) {
  return (
    <div className="glass-card rounded-3xl flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
      <Icon size={32} />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + second).toUpperCase() || '?';
}

