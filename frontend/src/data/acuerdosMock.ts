// Datos mock para la vista de Acuerdos. Se reemplazará por API real
// (ver lista de backend al final de la PR).

export type EstadoAcuerdo = 'Vigente' | 'Cumplido' | 'Incumplido' | 'Vencido';
export type EstadoCuota = 'Pagada' | 'Pendiente' | 'Atrasada';

export interface CuotaAcuerdo {
  numero: number;
  fechaProgramada: string;
  fechaPago: string | null;
  monto: number;
  estado: EstadoCuota;
}

export interface NotaSeguimiento {
  id: number;
  autor: string;
  fecha: string;
  texto: string;
}

export interface Acuerdo {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  deudaOriginal: number;
  montoAcordado: number;
  cuotasTotales: number;
  cuotasPagadas: number;
  valorCuota: number;
  fechaInicio: string;
  fechaFin: string;
  proximoPago: { fecha: string; monto: number } | null;
  estado: EstadoAcuerdo;
  cumplimiento: number; // porcentaje 0-100 (pagado / monto acordado)
  gestor: string;
  condiciones: string;
  cuotas: CuotaAcuerdo[];
  notas: NotaSeguimiento[];
}

// Helper para mock — genera cuotas básicas
function gen(
  total: number,
  pagadas: number,
  inicio: string,
  valor: number,
  ultimaPagadaFecha?: string,
): CuotaAcuerdo[] {
  const out: CuotaAcuerdo[] = [];
  const d = new Date(inicio);
  for (let i = 1; i <= total; i++) {
    const programada = new Date(d.getFullYear(), d.getMonth() + (i - 1), d.getDate());
    const iso = programada.toISOString().slice(0, 10);
    if (i <= pagadas) {
      out.push({
        numero: i,
        fechaProgramada: iso,
        fechaPago: i === pagadas && ultimaPagadaFecha ? ultimaPagadaFecha : iso,
        monto: valor,
        estado: 'Pagada',
      });
    } else if (i === pagadas + 1) {
      const today = new Date('2026-05-23');
      const atrasada = programada < today;
      out.push({
        numero: i,
        fechaProgramada: iso,
        fechaPago: null,
        monto: valor,
        estado: atrasada ? 'Atrasada' : 'Pendiente',
      });
    } else {
      out.push({
        numero: i,
        fechaProgramada: iso,
        fechaPago: null,
        monto: valor,
        estado: 'Pendiente',
      });
    }
  }
  return out;
}

export const acuerdosMock: Acuerdo[] = [
  // ── Vigentes (5) ──────────────────────────────────────
  {
    id: 'A-2001',
    clienteId: 'C-1004',
    clienteNombre: 'Sandra Milena Vargas',
    clienteEmail: 'sandra.vargas@correo.com',
    clienteTelefono: '+57 312 3456789',
    deudaOriginal: 5400000,
    montoAcordado: 4800000,
    cuotasTotales: 6,
    cuotasPagadas: 3,
    valorCuota: 800000,
    fechaInicio: '2026-02-15',
    fechaFin: '2026-07-15',
    proximoPago: { fecha: '2026-06-15', monto: 800000 },
    estado: 'Vigente',
    cumplimiento: 50,
    gestor: 'Catalina Ríos',
    condiciones: 'Acuerdo de pago a 6 cuotas mensuales con condonación del 11% de intereses moratorios. Débito automático desde el 15 de cada mes.',
    cuotas: gen(6, 3, '2026-02-15', 800000),
    notas: [
      { id: 1, autor: 'Catalina Ríos', fecha: '2026-05-15', texto: 'Cuota 3 pagada puntualmente. Cliente comprometida con el plan.' },
      { id: 2, autor: 'Catalina Ríos', fecha: '2026-02-15', texto: 'Acuerdo firmado por SMS con débito automático activo.' },
    ],
  },
  {
    id: 'A-2002',
    clienteId: 'C-1007',
    clienteNombre: 'Jorge Luis Mendoza',
    clienteEmail: 'jorge.mendoza@correo.com',
    clienteTelefono: '+57 311 9988776',
    deudaOriginal: 7800000,
    montoAcordado: 7200000,
    cuotasTotales: 12,
    cuotasPagadas: 4,
    valorCuota: 600000,
    fechaInicio: '2026-01-20',
    fechaFin: '2026-12-20',
    proximoPago: { fecha: '2026-06-20', monto: 600000 },
    estado: 'Vigente',
    cumplimiento: 33,
    gestor: 'Andrés Mejía',
    condiciones: 'Refinanciación a 12 cuotas con cambio de fecha de cuota al día 20 (post-quincena). Tasa preferencial 1.4% MV.',
    cuotas: gen(12, 4, '2026-01-20', 600000),
    notas: [
      { id: 1, autor: 'Andrés Mejía', fecha: '2026-05-20', texto: 'Cuota 4 al día. Cliente ha mejorado puntualidad.' },
    ],
  },
  {
    id: 'A-2003',
    clienteId: 'C-1015',
    clienteNombre: 'Mauricio Bermúdez Lara',
    clienteEmail: 'mauricio.bermudez@correo.com',
    clienteTelefono: '+57 324 1112233',
    deudaOriginal: 7400000,
    montoAcordado: 6800000,
    cuotasTotales: 8,
    cuotasPagadas: 1,
    valorCuota: 850000,
    fechaInicio: '2026-04-10',
    fechaFin: '2026-11-10',
    proximoPago: { fecha: '2026-06-10', monto: 850000 },
    estado: 'Vigente',
    cumplimiento: 12,
    gestor: 'Andrés Mejía',
    condiciones: 'Acuerdo con codeudor. Primera cuota cancelada al firmar. Visita domiciliaria de verificación mensual.',
    cuotas: gen(8, 1, '2026-04-10', 850000),
    notas: [
      { id: 1, autor: 'Andrés Mejía', fecha: '2026-04-10', texto: 'Firma presencial con codeudor. Visita programada para junio.' },
    ],
  },
  {
    id: 'A-2004',
    clienteId: 'C-1017',
    clienteNombre: 'Hernán Daniel Sosa',
    clienteEmail: 'hernan.sosa@correo.com',
    clienteTelefono: '+57 326 8899001',
    deudaOriginal: 12500000,
    montoAcordado: 11800000,
    cuotasTotales: 10,
    cuotasPagadas: 2,
    valorCuota: 1180000,
    fechaInicio: '2026-03-05',
    fechaFin: '2026-12-05',
    proximoPago: { fecha: '2026-06-05', monto: 1180000 },
    estado: 'Vigente',
    cumplimiento: 20,
    gestor: 'Catalina Ríos',
    condiciones: 'Refinanciación a 10 cuotas. Adaptación al nuevo ciclo de pago (cliente independiente).',
    cuotas: gen(10, 2, '2026-03-05', 1180000),
    notas: [],
  },
  {
    id: 'A-2005',
    clienteId: 'C-1018',
    clienteNombre: 'Catalina Restrepo Vargas',
    clienteEmail: 'catalina.restrepo@correo.com',
    clienteTelefono: '+57 327 4455667',
    deudaOriginal: 2200000,
    montoAcordado: 1900000,
    cuotasTotales: 3,
    cuotasPagadas: 2,
    valorCuota: 633000,
    fechaInicio: '2026-03-20',
    fechaFin: '2026-06-20',
    proximoPago: { fecha: '2026-06-20', monto: 633000 },
    estado: 'Vigente',
    cumplimiento: 67,
    gestor: 'Catalina Ríos',
    condiciones: 'Plan corto de 3 cuotas con primera cuota al firmar. Sin intereses moratorios.',
    cuotas: gen(3, 2, '2026-03-20', 633000),
    notas: [
      { id: 1, autor: 'Catalina Ríos', fecha: '2026-05-20', texto: 'Última cuota pendiente. Recordatorio programado para 18 de junio.' },
    ],
  },

  // ── Cumplidos (3) ─────────────────────────────────────
  {
    id: 'A-2006',
    clienteId: 'C-1019',
    clienteNombre: 'Nicolás Andrés Pinzón',
    clienteEmail: 'nicolas.pinzon@correo.com',
    clienteTelefono: '+57 328 7788990',
    deudaOriginal: 3500000,
    montoAcordado: 3200000,
    cuotasTotales: 4,
    cuotasPagadas: 4,
    valorCuota: 800000,
    fechaInicio: '2026-01-15',
    fechaFin: '2026-04-15',
    proximoPago: null,
    estado: 'Cumplido',
    cumplimiento: 100,
    gestor: 'Andrés Mejía',
    condiciones: 'Plan en 4 cuotas con condonación del 9% de intereses. Cliente recuperado.',
    cuotas: gen(4, 4, '2026-01-15', 800000, '2026-04-14'),
    notas: [
      { id: 1, autor: 'Andrés Mejía', fecha: '2026-04-15', texto: 'Acuerdo cumplido al 100%. Cliente reactivado para nuevos productos.' },
    ],
  },
  {
    id: 'A-2007',
    clienteId: 'C-1020',
    clienteNombre: 'Valentina Quiroga Mejía',
    clienteEmail: 'valentina.quiroga@correo.com',
    clienteTelefono: '+57 329 6677889',
    deudaOriginal: 1800000,
    montoAcordado: 1700000,
    cuotasTotales: 2,
    cuotasPagadas: 2,
    valorCuota: 850000,
    fechaInicio: '2026-02-10',
    fechaFin: '2026-03-10',
    proximoPago: null,
    estado: 'Cumplido',
    cumplimiento: 100,
    gestor: 'Catalina Ríos',
    condiciones: 'Plan exprés de 2 cuotas. Cliente con buen historial previo.',
    cuotas: gen(2, 2, '2026-02-10', 850000, '2026-03-09'),
    notas: [
      { id: 1, autor: 'Catalina Ríos', fecha: '2026-03-10', texto: 'Cumplimiento perfecto.' },
    ],
  },
  {
    id: 'A-2008',
    clienteId: 'C-1021',
    clienteNombre: 'Esteban Camilo Restrepo',
    clienteEmail: 'esteban.restrepo@correo.com',
    clienteTelefono: '+57 330 5566778',
    deudaOriginal: 6200000,
    montoAcordado: 5800000,
    cuotasTotales: 6,
    cuotasPagadas: 6,
    valorCuota: 966000,
    fechaInicio: '2025-11-05',
    fechaFin: '2026-04-05',
    proximoPago: null,
    estado: 'Cumplido',
    cumplimiento: 100,
    gestor: 'Andrés Mejía',
    condiciones: 'Plan de 6 cuotas con débito automático. Cumplimiento ejemplar.',
    cuotas: gen(6, 6, '2025-11-05', 966000, '2026-04-04'),
    notas: [],
  },

  // ── Incumplidos (2) ───────────────────────────────────
  {
    id: 'A-2009',
    clienteId: 'C-1008',
    clienteNombre: 'Patricia Ortega Suárez',
    clienteEmail: 'patricia.ortega@correo.com',
    clienteTelefono: '+57 317 4433221',
    deudaOriginal: 15800000,
    montoAcordado: 14500000,
    cuotasTotales: 8,
    cuotasPagadas: 1,
    valorCuota: 1812500,
    fechaInicio: '2026-01-25',
    fechaFin: '2026-08-25',
    proximoPago: null,
    estado: 'Incumplido',
    cumplimiento: 12,
    gestor: 'Andrés Mejía',
    condiciones: 'Acuerdo con descuento del 60% en intereses moratorios. Trasladado a jurídica tras incumplimiento.',
    cuotas: gen(8, 1, '2026-01-25', 1812500),
    notas: [
      { id: 1, autor: 'Andrés Mejía', fecha: '2026-04-10', texto: 'Cliente sin respuesta hace 60 días. Trasladando expediente a jurídica.' },
      { id: 2, autor: 'Andrés Mejía', fecha: '2026-02-26', texto: 'Cuota 2 vencida sin pago ni respuesta a 3 contactos.' },
    ],
  },
  {
    id: 'A-2010',
    clienteId: 'C-1023',
    clienteNombre: 'Walter Aníbal Caro',
    clienteEmail: 'walter.caro@correo.com',
    clienteTelefono: '+57 331 9988776',
    deudaOriginal: 9100000,
    montoAcordado: 8200000,
    cuotasTotales: 6,
    cuotasPagadas: 0,
    valorCuota: 1366000,
    fechaInicio: '2026-02-01',
    fechaFin: '2026-07-01',
    proximoPago: null,
    estado: 'Incumplido',
    cumplimiento: 0,
    gestor: 'Andrés Mejía',
    condiciones: 'Acuerdo firmado pero sin pago de primera cuota. Cliente hostil al contacto.',
    cuotas: gen(6, 0, '2026-02-01', 1366000),
    notas: [
      { id: 1, autor: 'Andrés Mejía', fecha: '2026-03-15', texto: 'Cliente no respondió a ningún contacto. Acuerdo anulado y caso traslado.' },
    ],
  },

  // ── Vencidos (2) ──────────────────────────────────────
  {
    id: 'A-2011',
    clienteId: 'C-1024',
    clienteNombre: 'Liliana Castro Méndez',
    clienteEmail: 'liliana.castro@correo.com',
    clienteTelefono: '+57 323 9988776',
    deudaOriginal: 6300000,
    montoAcordado: 5800000,
    cuotasTotales: 4,
    cuotasPagadas: 3,
    valorCuota: 1450000,
    fechaInicio: '2026-01-15',
    fechaFin: '2026-04-15',
    proximoPago: { fecha: '2026-04-15', monto: 1450000 },
    estado: 'Vencido',
    cumplimiento: 75,
    gestor: 'Catalina Ríos',
    condiciones: 'Plan en 4 cuotas. Falta única cuota vencida hace 38 días.',
    cuotas: gen(4, 3, '2026-01-15', 1450000),
    notas: [
      { id: 1, autor: 'Catalina Ríos', fecha: '2026-05-20', texto: 'Cliente solicita ampliación de plazo para última cuota.' },
      { id: 2, autor: 'Catalina Ríos', fecha: '2026-04-20', texto: 'Cuota 4 vencida. Cliente promete pagar en 15 días.' },
    ],
  },
  {
    id: 'A-2012',
    clienteId: 'C-1025',
    clienteNombre: 'Carlos Hernando Salgado',
    clienteEmail: 'carlos.salgado@correo.com',
    clienteTelefono: '+57 332 5544332',
    deudaOriginal: 4200000,
    montoAcordado: 3900000,
    cuotasTotales: 5,
    cuotasPagadas: 2,
    valorCuota: 780000,
    fechaInicio: '2025-12-10',
    fechaFin: '2026-04-10',
    proximoPago: { fecha: '2026-03-10', monto: 780000 },
    estado: 'Vencido',
    cumplimiento: 40,
    gestor: 'Andrés Mejía',
    condiciones: 'Plan en 5 cuotas con débito automático. Cuenta sin fondos en última cuota.',
    cuotas: gen(5, 2, '2025-12-10', 780000),
    notas: [
      { id: 1, autor: 'Andrés Mejía', fecha: '2026-05-10', texto: 'Cliente responde mensajes pero no concreta nueva fecha de pago.' },
    ],
  },

  // ── Extra: Vigente con buen progreso (13) ─────────────
  {
    id: 'A-2013',
    clienteId: 'C-1026',
    clienteNombre: 'Adriana Salcedo Niño',
    clienteEmail: 'adriana.salcedo@correo.com',
    clienteTelefono: '+57 333 8877665',
    deudaOriginal: 28500000,
    montoAcordado: 26000000,
    cuotasTotales: 24,
    cuotasPagadas: 8,
    valorCuota: 1083000,
    fechaInicio: '2025-09-01',
    fechaFin: '2027-08-01',
    proximoPago: { fecha: '2026-06-01', monto: 1083000 },
    estado: 'Vigente',
    cumplimiento: 33,
    gestor: 'Catalina Ríos',
    condiciones: 'Refinanciación a 24 meses con tasa preferencial 1.5% MV. Pago automático.',
    cuotas: gen(24, 8, '2025-09-01', 1083000),
    notas: [
      { id: 1, autor: 'Catalina Ríos', fecha: '2026-05-01', texto: 'Plan al día. Próxima revisión semestral en julio.' },
    ],
  },
];
