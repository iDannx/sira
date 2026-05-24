// Datos mock para la vista de Estrategias.
// Mínimo 10 clientes por nivel en cada sección para validar la agrupación
// por perfil de riesgo. Se reemplazará por API real (ver lista de backend
// al final de la PR).

export type NivelAfinidad = 'Alto' | 'Medio' | 'Bajo';
export type NivelRiesgo = 'Bajo' | 'Medio' | 'Alto';

export interface ClientePerfilamiento {
  id: number;
  nombre: string;
  perfil: string;
  productoSugerido: string;
  afinidad: number;
  nivelAfinidad: NivelAfinidad;
  estrategia: string;
  fechaGeneracion: string;
}

export interface ClienteRecuperacion {
  id: number;
  nombre: string;
  diasMora: number;
  nivelRiesgo: NivelRiesgo;
  comportamientoPago: string;
  montoVencido: number;
  estrategia: string;
  fechaGeneracion: string;
}

export const MOCK_PERFILAMIENTO: ClientePerfilamiento[] = [
  // ── Alto (12) ─────────────────────────────────────────
  { id: 1,  nombre: 'María Camila Rojas',     perfil: 'Pagador puntual · 18 meses sin mora',         productoSugerido: 'Compra de cartera',         afinidad: 92, nivelAfinidad: 'Alto',
    estrategia: 'María Camila ha mantenido pagos puntuales durante 18 meses consecutivos y muestra una capacidad de endeudamiento subutilizada del 35%. Se recomienda ofrecer una compra de cartera que consolide sus créditos externos (tarjeta Banco X por $4.200.000 y libranza por $6.800.000) bajo una tasa preferencial del 1.4% MV. Enviar por WhatsApp con simulación previa. Estimación de ahorro mensual: $128.000.', fechaGeneracion: '2026-05-20' },
  { id: 2,  nombre: 'Andrés Felipe Gómez',    perfil: 'Alta capacidad de endeudamiento · Score 780', productoSugerido: 'Crédito de libre inversión', afinidad: 88, nivelAfinidad: 'Alto',
    estrategia: 'Andrés presenta score crediticio de 780, ingresos estables verificados por Open Finance y endeudamiento del 22%. Ofrecer libre inversión hasta $25.000.000 a 60 meses, tasa 1.65% MV. Canal: correo con landing personalizada.', fechaGeneracion: '2026-05-20' },
  { id: 4,  nombre: 'Juan Sebastián Morales', perfil: 'Pagador puntual · Nicho juvenil',             productoSugerido: 'Crédito educativo',          afinidad: 81, nivelAfinidad: 'Alto',
    estrategia: 'Perfil de 22 años, estudiante universitario en último semestre con apoyo familiar. Microcrédito vigente sin mora. Ofrecer crédito educativo hasta $8.000.000 para posgrado, periodo de gracia 12 meses. Canal: WhatsApp Business.', fechaGeneracion: '2026-05-21' },
  { id: 5,  nombre: 'Diana Patricia Vega',    perfil: 'Cliente premium · Score 820',                 productoSugerido: 'Tarjeta de crédito Gold',     afinidad: 95, nivelAfinidad: 'Alto',
    estrategia: 'Diana cumple criterios para upgrade a Gold: ingresos > $8M, 5+ años de relación, sin mora histórica. Beneficios a comunicar: cashback 2%, sala VIP, seguro de viaje. Oferta personalizada por correo + llamada de bienvenida.', fechaGeneracion: '2026-05-19' },
  { id: 7,  nombre: 'Tatiana Restrepo Ávila', perfil: 'Score 800 · Empleada formal 8 años',          productoSugerido: 'Crédito hipotecario',        afinidad: 90, nivelAfinidad: 'Alto',
    estrategia: 'Tatiana tiene 8 años de antigüedad laboral verificada y score 800. Ofrecer crédito hipotecario VIS por $180M a 240 meses con tasa fija 11.5% EA. Incluir simulación de cuota y agendar cita con asesor inmobiliario.', fechaGeneracion: '2026-05-22' },
  { id: 8,  nombre: 'Felipe Cárdenas León',   perfil: 'Empresario · Flujo robusto',                  productoSugerido: 'Línea de crédito empresarial', afinidad: 87, nivelAfinidad: 'Alto',
    estrategia: 'Cliente con flujo mensual verificado > $40M, ratio operativo saludable. Ofrecer línea revolvente hasta $80M con tasa preferencial del 1.55% MV. Canal: correo + visita comercial.', fechaGeneracion: '2026-05-22' },
  { id: 9,  nombre: 'Ana Lucía Bermúdez',     perfil: 'Pagadora puntual · 24 meses',                 productoSugerido: 'Seguro de vida vinculado',   afinidad: 83, nivelAfinidad: 'Alto',
    estrategia: 'Ana tiene 24 meses sin mora y sin productos de protección. Ofrecer seguro de vida $200M cobertura con prima de $48.000/mes vinculada al débito automático. Comunicar como complemento al crédito hipotecario activo.', fechaGeneracion: '2026-05-19' },
  { id: 10, nombre: 'Roberto Carlos Quiroga', perfil: 'Profesional independiente · Score 790',       productoSugerido: 'Crédito de libre inversión', afinidad: 85, nivelAfinidad: 'Alto',
    estrategia: 'Médico especialista con ingresos verificados por OF y endeudamiento bajo. Ofrecer libre inversión hasta $30M a 48 meses, tasa 1.6% MV. Canal: llamada + correo formal con propuesta personalizada.', fechaGeneracion: '2026-05-21' },
  { id: 11, nombre: 'Camila Andrea Soto',     perfil: 'Cliente recurrente · Alto engagement',        productoSugerido: 'Tarjeta cashback',            afinidad: 80, nivelAfinidad: 'Alto',
    estrategia: 'Cliente con uso intensivo de banca digital y patrón de consumo en categorías premium. Ofrecer tarjeta cashback con devolución del 3% en gasolina, supermercado y restaurantes. Comunicación por push notification + email.', fechaGeneracion: '2026-05-23' },
  { id: 12, nombre: 'David Esteban Pinilla',  perfil: 'Score 810 · Bajo apalancamiento',             productoSugerido: 'Aumento de cupo',             afinidad: 89, nivelAfinidad: 'Alto',
    estrategia: 'David usa solo el 28% de su cupo actual. Ofrecer aumento automático del 60% ($3.000.000 → $4.800.000) con confirmación por SMS. Sin necesidad de revisión documental.', fechaGeneracion: '2026-05-22' },
  { id: 13, nombre: 'Mónica Lozano Téllez',   perfil: 'Alta capacidad · Cliente nuevo de calidad',   productoSugerido: 'Crédito vehículo',            afinidad: 84, nivelAfinidad: 'Alto',
    estrategia: 'Cliente nueva con score 795 al ingresar. Ha mostrado interés en simulador vehicular. Ofrecer crédito vehículo hasta $90M a 60 meses, tasa 1.45% MV. Llamada del asesor + agenda con concesionarios aliados.', fechaGeneracion: '2026-05-23' },
  { id: 14, nombre: 'Sergio Andrés Páez',     perfil: 'Empleado público · Estabilidad alta',         productoSugerido: 'Libranza',                   afinidad: 86, nivelAfinidad: 'Alto',
    estrategia: 'Funcionario público con descuento por nómina disponible. Ofrecer crédito de libranza hasta $50M a 84 meses con tasa preferencial 1.3% MV. Canal: correo institucional + jornada presencial en la entidad.', fechaGeneracion: '2026-05-20' },

  // ── Medio (10) ────────────────────────────────────────
  { id: 3,  nombre: 'Laura Stefanía Pérez',   perfil: 'Cliente recurrente · Bajo endeudamiento',     productoSugerido: 'Aumento de cupo',             afinidad: 76, nivelAfinidad: 'Medio',
    estrategia: 'Laura tiene 3 productos activos al día y usa menos del 40% de su cupo. Recomendar aumento del 50% ($1.500.000 → $2.250.000). Notificación informativa, no oferta agresiva.', fechaGeneracion: '2026-05-18' },
  { id: 6,  nombre: 'Carlos Eduardo Niño',    perfil: 'Capacidad media · Buen historial',            productoSugerido: 'Crédito de vehículo',         afinidad: 68, nivelAfinidad: 'Medio',
    estrategia: 'Interés en simuladores vehiculares (3 visitas en 30 días). Califica para crédito hasta $45M a 60 meses. Activar retargeting + llamada en franja 6-8pm.', fechaGeneracion: '2026-05-18' },
  { id: 15, nombre: 'Paula Andrea Hoyos',     perfil: 'Score 720 · Mora ocasional',                  productoSugerido: 'Crédito de consumo',          afinidad: 65, nivelAfinidad: 'Medio',
    estrategia: 'Paula califica para libre inversión hasta $12M a 36 meses, pero con tasa estándar (1.85% MV). Importante: solicitar confirmación de ingresos vía OF antes del desembolso.', fechaGeneracion: '2026-05-22' },
  { id: 16, nombre: 'Javier Camargo Ruiz',    perfil: 'Cliente recurrente · Endeudamiento medio',    productoSugerido: 'Refinanciación blanda',       afinidad: 72, nivelAfinidad: 'Medio',
    estrategia: 'Javier paga 4 productos en distintas entidades. Ofrecer refinanciación unificada que baje cuota mensual en 18%. Comunicar como "alivio financiero", no como nueva deuda.', fechaGeneracion: '2026-05-22' },
  { id: 17, nombre: 'Adriana Marín Cubillos', perfil: 'Capacidad media · Patrón estacional',         productoSugerido: 'Crédito rotativo',            afinidad: 67, nivelAfinidad: 'Medio',
    estrategia: 'Patrón de gastos concentrado en temporada escolar (enero) y diciembre. Ofrecer rotativo con cupo flexible $5M para cubrir picos. Tasa 1.95% MV.', fechaGeneracion: '2026-05-22' },
  { id: 18, nombre: 'Óscar Mauricio Téllez',  perfil: 'Score 700 · Empleado estable',                productoSugerido: 'Tarjeta clásica',             afinidad: 70, nivelAfinidad: 'Medio',
    estrategia: 'Cliente sin tarjeta de crédito hasta hoy. Ofrecer tarjeta clásica con cupo inicial $2M para construcción de historial. Educar en buen uso vía landing con video corto.', fechaGeneracion: '2026-05-20' },
  { id: 19, nombre: 'Yuliana Bedoya Cano',    perfil: 'Empleada formal · Endeudamiento moderado',    productoSugerido: 'Crédito educativo',           afinidad: 64, nivelAfinidad: 'Medio',
    estrategia: 'Yuliana ha consultado en página web "crédito educativo" 5 veces. Ofrecer educativo hasta $15M a 60 meses con codeudor opcional. Canal: WhatsApp con material descargable.', fechaGeneracion: '2026-05-21' },
  { id: 20, nombre: 'Hernando Caicedo Mejía', perfil: 'Score 715 · Senior',                          productoSugerido: 'Plan de inversión',           afinidad: 69, nivelAfinidad: 'Medio',
    estrategia: 'Cliente 58 años, sin productos de inversión. Ofrecer CDT a 360 días con tasa preferencial del 11.2% EA. Llamada directa del asesor patrimonial.', fechaGeneracion: '2026-05-19' },
  { id: 21, nombre: 'Viviana Sandoval Ruiz',  perfil: 'Pagadora moderada · 1 producto activo',       productoSugerido: 'Seguro hogar',                afinidad: 66, nivelAfinidad: 'Medio',
    estrategia: 'Viviana tiene crédito hipotecario sin seguro de hogar contratado. Ofrecer seguro con prima $24.000/mes incluyendo cobertura por incendio, terremoto y desastres. Email + push.', fechaGeneracion: '2026-05-20' },
  { id: 22, nombre: 'Néstor Fabio Salgado',   perfil: 'Score 705 · Empleado mediano plazo',          productoSugerido: 'Aumento de cupo',             afinidad: 71, nivelAfinidad: 'Medio',
    estrategia: 'Néstor mantiene tarjeta de crédito siempre al 80% del cupo. Aumento moderado al 30% (cupo $3M → $3.9M) con seguimiento mensual del comportamiento.', fechaGeneracion: '2026-05-23' },

  // ── Bajo (10) ─────────────────────────────────────────
  { id: 23, nombre: 'Daniela Suárez Cano',    perfil: 'Score 640 · Mora histórica recurrente',       productoSugerido: 'Producto débito',             afinidad: 42, nivelAfinidad: 'Bajo',
    estrategia: 'Score insuficiente para productos de crédito. Ofrecer tarjeta débito con beneficios cashback básico y acceso a educación financiera digital. Sin oferta crediticia por ahora.', fechaGeneracion: '2026-05-20' },
  { id: 24, nombre: 'Jaime Andrés Forero',    perfil: 'Cliente reciente · Sin historial',            productoSugerido: 'Microcrédito controlado',     afinidad: 38, nivelAfinidad: 'Bajo',
    estrategia: 'Sin historial crediticio. Ofrecer microcrédito de $500.000 a 6 meses como producto de entrada y construcción de score. Con educación financiera obligatoria previa.', fechaGeneracion: '2026-05-19' },
  { id: 25, nombre: 'Estefanía Rojas Pico',   perfil: 'Score 620 · Ingreso variable',                productoSugerido: 'Cuenta de ahorro programado', afinidad: 35, nivelAfinidad: 'Bajo',
    estrategia: 'Patrón de ingreso muy irregular. Sugerir cuenta de ahorro programado con meta mensual de $80.000. Sin productos de crédito hasta estabilización del flujo.', fechaGeneracion: '2026-05-21' },
  { id: 26, nombre: 'Luis Alfonso Manrique',  perfil: 'Score 600 · Score declinante',                productoSugerido: 'Asesoría financiera',         afinidad: 30, nivelAfinidad: 'Bajo',
    estrategia: 'Score ha caído 80 puntos en últimos 6 meses. Antes de cualquier oferta, agendar asesoría financiera gratuita para diagnóstico. Suspender ofertas crediticias automáticas.', fechaGeneracion: '2026-05-18' },
  { id: 27, nombre: 'Rosa Helena Pulido',     perfil: 'Score 655 · Adulta mayor',                    productoSugerido: 'Cuenta de jubilación',        afinidad: 40, nivelAfinidad: 'Bajo',
    estrategia: 'Adulta mayor, sin necesidad de productos crediticios. Ofrecer cuenta de jubilación con seguros básicos incluidos y servicio al cliente preferencial.', fechaGeneracion: '2026-05-22' },
  { id: 28, nombre: 'Sebastián Camilo Vega',  perfil: 'Score 615 · Joven sin historial estable',     productoSugerido: 'Educación financiera',        afinidad: 33, nivelAfinidad: 'Bajo',
    estrategia: 'Cliente 21 años recién egresado, sin ingreso fijo aún. Inscribir en programa de educación financiera gratuito y monitorear hasta estabilización laboral.', fechaGeneracion: '2026-05-23' },
  { id: 29, nombre: 'Beatriz Helena Mejía',   perfil: 'Score 625 · Mora resuelta hace 3 meses',      productoSugerido: 'Microcrédito de prueba',      afinidad: 41, nivelAfinidad: 'Bajo',
    estrategia: 'Resolvió mora reciente. Ofrecer microcrédito de prueba $300.000 a 4 meses con tasa estándar. Monitorear puntualidad antes de escalar oferta.', fechaGeneracion: '2026-05-21' },
  { id: 30, nombre: 'Alexis Tovar Calderón',  perfil: 'Score 635 · Endeudamiento alto',              productoSugerido: 'Plan de saneamiento',         afinidad: 36, nivelAfinidad: 'Bajo',
    estrategia: 'Endeudamiento ya al 78%. Antes que oferta de crédito, ofrecer plan de saneamiento financiero gratuito y monitorear durante 6 meses.', fechaGeneracion: '2026-05-19' },
  { id: 31, nombre: 'Marisol Cortés Bautista', perfil: 'Score 645 · Múltiples productos vencidos',   productoSugerido: 'Refinanciación condicional',  afinidad: 32, nivelAfinidad: 'Bajo',
    estrategia: 'Múltiples productos en mora. Ofrecer refinanciación condicional con quita parcial sujeta a 6 meses de buen comportamiento. No ofrecer nuevos productos.', fechaGeneracion: '2026-05-18' },
  { id: 32, nombre: 'Rodrigo Beltrán Téllez', perfil: 'Score 610 · Ingreso bajo',                    productoSugerido: 'Producto débito',             afinidad: 34, nivelAfinidad: 'Bajo',
    estrategia: 'Ingreso reportado bajo el mínimo para productos crediticios. Mantener débito con beneficios básicos y monitoreo trimestral.', fechaGeneracion: '2026-05-20' },
];

export const MOCK_RECUPERACION: ClienteRecuperacion[] = [
  // ── Bajo (10) ─────────────────────────────────────────
  { id: 1,  nombre: 'Pedro Antonio Salas',   diasMora: 15, nivelRiesgo: 'Bajo',  montoVencido: 850000,
    comportamientoPago: 'Suele atrasarse 1-2 semanas, paga sin gestión intensiva',
    estrategia: 'Mora temprana en perfil históricamente recuperable. WhatsApp empático automatizado en día 16. NO escalar a llamada. Si no responde en 72h, segundo mensaje con opción de fraccionamiento. Probabilidad de pago sin gestión humana: 78%.', fechaGeneracion: '2026-05-20' },
  { id: 4,  nombre: 'Marcela Hernández Ruiz', diasMora: 8,  nivelRiesgo: 'Bajo',  montoVencido: 320000,
    comportamientoPago: 'Primera mora en 2 años, probable olvido',
    estrategia: 'Atípico. Probable causa: olvido. Notificación amistosa automática por SMS y WhatsApp + link de pago en 1 clic. Evitar tono cobratorio. Probabilidad de pago en 48h: 92%.', fechaGeneracion: '2026-05-21' },
  { id: 7,  nombre: 'Manuel Antonio Bohórquez', diasMora: 5,  nivelRiesgo: 'Bajo', montoVencido: 425000,
    comportamientoPago: 'Cliente regular, ocasionalmente atrasa por viaje',
    estrategia: 'Mora muy temprana. Recordatorio por SMS único + email. Sin escalamiento humano. Probabilidad de pago espontáneo: 88%.', fechaGeneracion: '2026-05-21' },
  { id: 8,  nombre: 'Sofía Margarita Álvarez',  diasMora: 22, nivelRiesgo: 'Bajo', montoVencido: 1100000,
    comportamientoPago: 'Atraso típico de 15-25 días, paga ante recordatorio',
    estrategia: 'Patrón conocido y predecible. Enviar WhatsApp con simulación de pago parcial o total. Ofrecer fraccionamiento solo si lo solicita. Sin gestor humano.', fechaGeneracion: '2026-05-22' },
  { id: 9,  nombre: 'Daniel Ricardo Espitia',  diasMora: 11, nivelRiesgo: 'Bajo', montoVencido: 680000,
    comportamientoPago: 'Mora ocasional sin patrón, score sano',
    estrategia: 'SMS + email recordatorio. Si no responde en 96h, llamada automatizada con bot conversacional. Sin escalamiento humano en esta etapa.', fechaGeneracion: '2026-05-21' },
  { id: 10, nombre: 'Carolina Niño Herrera',   diasMora: 18, nivelRiesgo: 'Bajo', montoVencido: 550000,
    comportamientoPago: 'Histórico limpio, primera mora en 18 meses',
    estrategia: 'Cliente confiable. Mensaje único por WhatsApp con tono amistoso. Sin presión. Si paga, agradecimiento automático + check-in en 60 días.', fechaGeneracion: '2026-05-22' },
  { id: 11, nombre: 'Iván Augusto Castaño',    diasMora: 3,  nivelRiesgo: 'Bajo', montoVencido: 240000,
    comportamientoPago: 'Atraso de pocos días, paga con un recordatorio',
    estrategia: 'Recordatorio único por SMS. No requerir mayor gestión. Probabilidad de pago en 72h: 95%.', fechaGeneracion: '2026-05-23' },
  { id: 12, nombre: 'Lina Patricia Mosquera',  diasMora: 26, nivelRiesgo: 'Bajo', montoVencido: 1450000,
    comportamientoPago: 'Mora moderada esporádica, sin necesidad de presión',
    estrategia: 'WhatsApp con opción de fraccionamiento en 2 cuotas. Si acepta, formalizar automáticamente. Sin llamada humana en primera etapa.', fechaGeneracion: '2026-05-22' },
  { id: 13, nombre: 'Carlos Mario Robles',     diasMora: 14, nivelRiesgo: 'Bajo', montoVencido: 760000,
    comportamientoPago: 'Cliente fiable, atrasa por flujo de freelance',
    estrategia: 'Conocer el patrón. Ofrecer cambio de fecha de cuota al día 15 de cada mes (post-cobros típicos de cliente). WhatsApp formal.', fechaGeneracion: '2026-05-23' },
  { id: 14, nombre: 'Isabella Cárdenas Niño',  diasMora: 20, nivelRiesgo: 'Bajo', montoVencido: 920000,
    comportamientoPago: 'Mora baja sostenida, sin alertas',
    estrategia: 'Recordatorio doble: SMS y email. Si paga en 48h, sin más gestión. Si no, llamada automatizada antes de día 30.', fechaGeneracion: '2026-05-19' },

  // ── Medio (10) ────────────────────────────────────────
  { id: 2,  nombre: 'Sandra Milena Vargas',   diasMora: 45, nivelRiesgo: 'Medio', montoVencido: 2400000,
    comportamientoPago: 'Mora recurrente pero negocia y cumple acuerdos',
    estrategia: 'Sandra responde bien a acuerdos personalizados, no a presión. Llamada de la gestora Catalina Ríos entre 10-12pm. Plan de pago en 3 cuotas con primera cuota condonando intereses moratorios. Riesgo de deserción si se presiona: ALTO.', fechaGeneracion: '2026-05-20' },
  { id: 5,  nombre: 'Jorge Luis Mendoza',     diasMora: 62, nivelRiesgo: 'Medio', montoVencido: 3150000,
    comportamientoPago: 'Inestable, alterna meses al día con moras de 30-90 días',
    estrategia: 'Problema de flujo de caja (cliente independiente). Cambio de fecha de cuota al día 15 + fraccionamiento de mora en 4 cuotas pequeñas. Llamada matutina + seguimiento por WhatsApp.', fechaGeneracion: '2026-05-22' },
  { id: 15, nombre: 'Catalina Restrepo Vargas', diasMora: 38, nivelRiesgo: 'Medio', montoVencido: 1850000,
    comportamientoPago: 'Negocia pero incumple primera promesa',
    estrategia: 'Llamada formal del gestor con propuesta concreta y firmada por SMS. Sin negociaciones verbales sin respaldo. Plan 3 cuotas con primera al firmar.', fechaGeneracion: '2026-05-22' },
  { id: 16, nombre: 'Hugo Ernesto Vásquez',    diasMora: 55, nivelRiesgo: 'Medio', montoVencido: 4100000,
    comportamientoPago: 'Reactivo, responde solo cuando lo llaman',
    estrategia: 'Llamada gestor humano en franja vespertina (4-7pm). Ofrecer plan en 5 cuotas con descuento del 20% en intereses moratorios si paga primera cuota en 5 días.', fechaGeneracion: '2026-05-21' },
  { id: 17, nombre: 'Natalia Suárez Galindo',  diasMora: 70, nivelRiesgo: 'Medio', montoVencido: 5200000,
    comportamientoPago: 'Cliente con buenos antecedentes pero crisis temporal reportada',
    estrategia: 'Cliente reportó crisis personal en última gestión. Ofrecer pausa de 60 días + plan en 6 cuotas posteriores con interés moratorio condonado al 100%.', fechaGeneracion: '2026-05-23' },
  { id: 18, nombre: 'Fernando Quintero Sánchez', diasMora: 50, nivelRiesgo: 'Medio', montoVencido: 2750000,
    comportamientoPago: 'Patrón irregular, responde mensajes pero evita compromisos',
    estrategia: 'WhatsApp con propuesta concreta y único botón de "Acepto". No más negociación abierta. Si acepta, formalizar el mismo día con débito programado.', fechaGeneracion: '2026-05-22' },
  { id: 19, nombre: 'Andrea Catalina Lozano',  diasMora: 33, nivelRiesgo: 'Medio', montoVencido: 1620000,
    comportamientoPago: 'Mora media con disposición a pagar pero sin capacidad',
    estrategia: 'Capacidad de pago verificada limitada. Plan en 6 cuotas pequeñas (max 15% del ingreso reportado). Sin intereses moratorios.', fechaGeneracion: '2026-05-21' },
  { id: 20, nombre: 'Mauricio Bermúdez Tarazona', diasMora: 47, nivelRiesgo: 'Medio', montoVencido: 3400000,
    comportamientoPago: 'Promete pero pospone, requiere seguimiento intenso',
    estrategia: 'Asignar gestor dedicado con seguimiento semanal por 8 semanas. Acuerdo firmado por SMS + débito automático al confirmar.', fechaGeneracion: '2026-05-20' },
  { id: 21, nombre: 'Gloria Esperanza Murillo', diasMora: 65, nivelRiesgo: 'Medio', montoVencido: 4900000,
    comportamientoPago: 'Cliente histórico, mora atípica reciente',
    estrategia: 'Cliente de 12 años. Llamada del jefe de cartera (no del gestor) con propuesta especial: pausa 30 días + plan 6 cuotas + tasa preferencial post-acuerdo.', fechaGeneracion: '2026-05-19' },
  { id: 22, nombre: 'Camilo José Aguirre',     diasMora: 42, nivelRiesgo: 'Medio', montoVencido: 2300000,
    comportamientoPago: 'Estable pero entró en mora por cambio de empleo',
    estrategia: 'Verificar nuevo empleo. Si confirmado, ofrecer plan de cuotas adaptado al nuevo ciclo de pago. WhatsApp con simulador.', fechaGeneracion: '2026-05-22' },

  // ── Alto (10) ─────────────────────────────────────────
  { id: 3,  nombre: 'Ricardo Andrés Lozano',  diasMora: 95,  nivelRiesgo: 'Alto', montoVencido: 5800000,
    comportamientoPago: 'Mora prolongada, evita contacto telefónico',
    estrategia: 'Caso crítico cerca del umbral jurídico. Cliente evade llamadas (8 fallidos en últimos 30 días) pero responde correo. Correo formal del jefe de cartera + descuento del 40% en intereses moratorios si paga capital en 30 días. Si no responde en 7 días → jurídica.', fechaGeneracion: '2026-05-20' },
  { id: 6,  nombre: 'Patricia Ortega Suárez', diasMora: 130, nivelRiesgo: 'Alto', montoVencido: 7900000,
    comportamientoPago: 'Sin respuesta en últimos 60 días, riesgo de castigo',
    estrategia: 'Cuenta en zona pre-castigo. Última oportunidad: pago único con 60% descuento sobre moratorios y plan de 6 cuotas para capital. Carta certificada al domicilio + correo + contacto vía referencia familiar. Si no responde en 15 días: castigar y enviar a abogados externos.', fechaGeneracion: '2026-05-21' },
  { id: 23, nombre: 'Hernán Daniel Sosa',      diasMora: 110, nivelRiesgo: 'Alto', montoVencido: 8200000,
    comportamientoPago: 'Mora prolongada, promesas incumplidas',
    estrategia: 'Cliente ha hecho 4 promesas de pago en 90 días, todas incumplidas. Carta jurídica de pre-aviso. Última oferta: pago único con 50% descuento moratorios + reactivación de relación a 12 meses.', fechaGeneracion: '2026-05-22' },
  { id: 24, nombre: 'Liliana Castro Méndez',   diasMora: 145, nivelRiesgo: 'Alto', montoVencido: 6300000,
    comportamientoPago: 'Sin respuesta hace 90 días',
    estrategia: 'Sin contacto en 90 días. Verificar referencias secundarias para localización. Carta certificada física + intento por dirección laboral registrada. Trasladar a jurídica en 10 días si no hay contacto.', fechaGeneracion: '2026-05-23' },
  { id: 25, nombre: 'Mauricio Bermúdez Lara',  diasMora: 75,  nivelRiesgo: 'Alto', montoVencido: 7400000,
    comportamientoPago: 'Promesas de pago incumplidas en últimos 3 meses',
    estrategia: 'Visita domiciliaria coordinada + propuesta de acuerdo con codeudor. Si rechaza: traslado a jurídica con expediente completo.', fechaGeneracion: '2026-05-23' },
  { id: 26, nombre: 'Walter Aníbal Caro',      diasMora: 88,  nivelRiesgo: 'Alto', montoVencido: 9100000,
    comportamientoPago: 'Hostil al contacto, agresividad reportada',
    estrategia: 'Cliente con reportes de agresividad. Sin llamadas. Solo correo certificado del área jurídica + visita con personal entrenado en seguridad. Documentar todo el proceso.', fechaGeneracion: '2026-05-22' },
  { id: 27, nombre: 'Ximena Gutiérrez Páez',   diasMora: 120, nivelRiesgo: 'Alto', montoVencido: 6800000,
    comportamientoPago: 'Sin respuesta, residencia fuera del país reportada',
    estrategia: 'Reporte: cliente residiría actualmente en el exterior. Verificar vía referencias. Si confirmado, gestión internacional + posible deuda incobrable. Castigar tras 30 días.', fechaGeneracion: '2026-05-20' },
  { id: 28, nombre: 'Eduardo Antonio Pérez',   diasMora: 105, nivelRiesgo: 'Alto', montoVencido: 11500000,
    comportamientoPago: 'Insolvencia inminente, ingresos cesaron',
    estrategia: 'Cliente sin ingreso reportado en últimos 60 días. Sin oferta de pago viable. Reestructuración con quita del 50% sujeta a verificación de insolvencia. Documentar para castigo si rechaza.', fechaGeneracion: '2026-05-19' },
  { id: 29, nombre: 'Catalina Riveros Mejía',  diasMora: 92,  nivelRiesgo: 'Alto', montoVencido: 5400000,
    comportamientoPago: 'Cliente con litigio reportado contra empleador',
    estrategia: 'Cliente en proceso jurídico laboral. Posibilidad de pago tras liquidación. Pausa formal de 90 días + acuerdo condicionado al pago de liquidación con cesión.', fechaGeneracion: '2026-05-21' },
  { id: 30, nombre: 'Bernardo Antonio Sosa',   diasMora: 165, nivelRiesgo: 'Alto', montoVencido: 12800000,
    comportamientoPago: 'Cliente reincidente, múltiples ciclos de mora-pago',
    estrategia: 'Patrón crónico. No ofrecer nuevas refinanciaciones blandas. Carta jurídica formal con plazo de 15 días. Tras vencimiento, traslado inmediato a abogados externos sin más gestión interna.', fechaGeneracion: '2026-05-18' },
];
