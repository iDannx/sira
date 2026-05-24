// Datos mock para la vista de Cartera. Se reemplazarán por API real (ver
// pages/Cartera.tsx → comentario "Backend a futuro").

export type NivelRiesgo = 'Bajo' | 'Medio' | 'Alto';
export type EstadoCartera = 'Al día' | 'En mora' | 'Castigada';

export interface PagoHistorico {
  fecha: string;
  monto: number;
}

export interface NotaGestion {
  id: number;
  autor: string;
  fecha: string;
  texto: string;
}

export interface EstrategiaAsignada {
  tipo: 'Recuperación' | 'Perfilamiento' | 'Refinanciación';
  resumen: string;
}

export interface ProductoActivo {
  tipo: string;
  monto: number;
}

export interface ClienteCartera {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaVinculacion: string;
  deudaTotal: number;
  diasMora: number;
  ultimoPago: string;
  riesgo: NivelRiesgo;
  estado: EstadoCartera;
  comportamientoPago: string;
  ultimosPagos: PagoHistorico[];
  productos: ProductoActivo[];
  estrategia: EstrategiaAsignada | null;
  notas: NotaGestion[];
}

export const carteraMock: ClienteCartera[] = [
  {
    id: 'C-1001',
    nombre: 'María Camila Rojas',
    email: 'maria.rojas@correo.com',
    telefono: '+57 310 4521234',
    fechaVinculacion: '2021-03-14',
    deudaTotal: 2500000,
    diasMora: 0,
    ultimoPago: '2026-05-15',
    riesgo: 'Bajo',
    estado: 'Al día',
    comportamientoPago: 'Pagador puntual, 18 meses consecutivos sin mora.',
    ultimosPagos: [
      { fecha: '2026-05-15', monto: 320000 },
      { fecha: '2026-04-15', monto: 320000 },
      { fecha: '2026-03-15', monto: 320000 },
      { fecha: '2026-02-15', monto: 320000 },
      { fecha: '2026-01-15', monto: 320000 },
    ],
    productos: [
      { tipo: 'Crédito educativo', monto: 2500000 },
    ],
    estrategia: null,
    notas: [
      { id: 1, autor: 'Catalina Ríos', fecha: '2026-04-10', texto: 'Cliente excelente, candidata a producto premium.' },
    ],
  },
  {
    id: 'C-1002',
    nombre: 'Andrés Felipe Gómez',
    email: 'andres.gomez@correo.com',
    telefono: '+57 320 7891245',
    fechaVinculacion: '2019-08-22',
    deudaTotal: 18750000,
    diasMora: 0,
    ultimoPago: '2026-05-12',
    riesgo: 'Bajo',
    estado: 'Al día',
    comportamientoPago: 'Score 780. Endeudamiento bajo y pagos siempre adelantados.',
    ultimosPagos: [
      { fecha: '2026-05-12', monto: 850000 },
      { fecha: '2026-04-12', monto: 850000 },
      { fecha: '2026-03-12', monto: 850000 },
      { fecha: '2026-02-12', monto: 850000 },
      { fecha: '2026-01-12', monto: 850000 },
    ],
    productos: [
      { tipo: 'Crédito libre inversión', monto: 12000000 },
      { tipo: 'Tarjeta de crédito', monto: 6750000 },
    ],
    estrategia: {
      tipo: 'Perfilamiento',
      resumen: 'Oferta de aumento de cupo y producto premium.',
    },
    notas: [],
  },
  {
    id: 'C-1003',
    nombre: 'Pedro Antonio Salas',
    email: 'pedro.salas@correo.com',
    telefono: '+57 315 6789012',
    fechaVinculacion: '2022-11-05',
    deudaTotal: 850000,
    diasMora: 15,
    ultimoPago: '2026-04-08',
    riesgo: 'Bajo',
    estado: 'En mora',
    comportamientoPago: 'Suele atrasarse 1-2 semanas, paga sin necesidad de gestión.',
    ultimosPagos: [
      { fecha: '2026-04-08', monto: 280000 },
      { fecha: '2026-03-10', monto: 280000 },
      { fecha: '2026-02-09', monto: 280000 },
      { fecha: '2026-01-12', monto: 280000 },
      { fecha: '2025-12-08', monto: 280000 },
    ],
    productos: [
      { tipo: 'Microcrédito', monto: 850000 },
    ],
    estrategia: {
      tipo: 'Recuperación',
      resumen: 'WhatsApp empático automatizado, sin escalamiento humano.',
    },
    notas: [
      { id: 1, autor: 'Sistema', fecha: '2026-05-08', texto: 'WhatsApp enviado automáticamente. Sin respuesta.' },
    ],
  },
  {
    id: 'C-1004',
    nombre: 'Sandra Milena Vargas',
    email: 'sandra.vargas@correo.com',
    telefono: '+57 312 3456789',
    fechaVinculacion: '2020-06-18',
    deudaTotal: 4200000,
    diasMora: 45,
    ultimoPago: '2026-03-22',
    riesgo: 'Medio',
    estado: 'En mora',
    comportamientoPago: 'Mora recurrente pero negocia y cumple los acuerdos firmados.',
    ultimosPagos: [
      { fecha: '2026-03-22', monto: 540000 },
      { fecha: '2026-02-18', monto: 540000 },
      { fecha: '2026-01-15', monto: 540000 },
      { fecha: '2025-12-20', monto: 540000 },
      { fecha: '2025-11-22', monto: 540000 },
    ],
    productos: [
      { tipo: 'Crédito de consumo', monto: 4200000 },
    ],
    estrategia: {
      tipo: 'Refinanciación',
      resumen: 'Plan de 3 cuotas con condonación de intereses moratorios.',
    },
    notas: [
      { id: 1, autor: 'Catalina Ríos', fecha: '2026-05-10', texto: 'Acordó pagar el 20 de mayo. Confirmar.' },
      { id: 2, autor: 'Catalina Ríos', fecha: '2026-04-25', texto: 'Cliente solicita ampliar plazo a 5 cuotas.' },
    ],
  },
  {
    id: 'C-1005',
    nombre: 'Ricardo Andrés Lozano',
    email: 'ricardo.lozano@correo.com',
    telefono: '+57 318 1112233',
    fechaVinculacion: '2018-02-10',
    deudaTotal: 9800000,
    diasMora: 95,
    ultimoPago: '2026-02-08',
    riesgo: 'Alto',
    estado: 'En mora',
    comportamientoPago: 'Mora prolongada. Evita contacto telefónico, responde solo a correo.',
    ultimosPagos: [
      { fecha: '2026-02-08', monto: 1100000 },
      { fecha: '2026-01-10', monto: 1100000 },
      { fecha: '2025-12-12', monto: 1100000 },
      { fecha: '2025-11-15', monto: 1100000 },
      { fecha: '2025-10-08', monto: 1100000 },
    ],
    productos: [
      { tipo: 'Crédito hipotecario', monto: 9800000 },
    ],
    estrategia: {
      tipo: 'Recuperación',
      resumen: 'Correo formal con descuento del 40% en intereses si paga capital en 30 días.',
    },
    notas: [
      { id: 1, autor: 'Andrés Mejía', fecha: '2026-05-05', texto: '8 intentos de llamada fallidos. Pasando a gestión por correo.' },
    ],
  },
  {
    id: 'C-1006',
    nombre: 'Laura Stefanía Pérez',
    email: 'laura.perez@correo.com',
    telefono: '+57 313 5566778',
    fechaVinculacion: '2023-01-20',
    deudaTotal: 1500000,
    diasMora: 0,
    ultimoPago: '2026-05-18',
    riesgo: 'Bajo',
    estado: 'Al día',
    comportamientoPago: 'Cliente recurrente, usa menos del 40% del cupo asignado.',
    ultimosPagos: [
      { fecha: '2026-05-18', monto: 180000 },
      { fecha: '2026-04-18', monto: 180000 },
      { fecha: '2026-03-18', monto: 180000 },
      { fecha: '2026-02-18', monto: 180000 },
      { fecha: '2026-01-18', monto: 180000 },
    ],
    productos: [
      { tipo: 'Tarjeta de crédito', monto: 1500000 },
    ],
    estrategia: null,
    notas: [],
  },
  {
    id: 'C-1007',
    nombre: 'Jorge Luis Mendoza',
    email: 'jorge.mendoza@correo.com',
    telefono: '+57 311 9988776',
    fechaVinculacion: '2021-09-12',
    deudaTotal: 6300000,
    diasMora: 62,
    ultimoPago: '2026-03-15',
    riesgo: 'Medio',
    estado: 'En mora',
    comportamientoPago: 'Inestable, alterna meses al día con moras de 30-90 días.',
    ultimosPagos: [
      { fecha: '2026-03-15', monto: 480000 },
      { fecha: '2026-02-02', monto: 480000 },
      { fecha: '2025-12-28', monto: 480000 },
      { fecha: '2025-11-30', monto: 480000 },
      { fecha: '2025-10-25', monto: 480000 },
    ],
    productos: [
      { tipo: 'Crédito de consumo', monto: 6300000 },
    ],
    estrategia: {
      tipo: 'Refinanciación',
      resumen: 'Cambio de fecha de cuota al día 15 + fraccionamiento de mora en 4 cuotas.',
    },
    notas: [
      { id: 1, autor: 'Catalina Ríos', fecha: '2026-04-30', texto: 'Cliente acepta cambio de fecha. Pendiente firmar.' },
    ],
  },
  {
    id: 'C-1008',
    nombre: 'Patricia Ortega Suárez',
    email: 'patricia.ortega@correo.com',
    telefono: '+57 317 4433221',
    fechaVinculacion: '2017-11-30',
    deudaTotal: 15800000,
    diasMora: 130,
    ultimoPago: '2025-12-15',
    riesgo: 'Alto',
    estado: 'En mora',
    comportamientoPago: 'Sin respuesta hace 60+ días. Riesgo inminente de castigo.',
    ultimosPagos: [
      { fecha: '2025-12-15', monto: 1450000 },
      { fecha: '2025-11-12', monto: 1450000 },
      { fecha: '2025-10-15', monto: 1450000 },
      { fecha: '2025-09-10', monto: 1450000 },
      { fecha: '2025-08-12', monto: 1450000 },
    ],
    productos: [
      { tipo: 'Crédito vehicular', monto: 15800000 },
    ],
    estrategia: {
      tipo: 'Recuperación',
      resumen: 'Carta certificada + 60% descuento intereses moratorios. Última gestión.',
    },
    notas: [
      { id: 1, autor: 'Andrés Mejía', fecha: '2026-05-12', texto: 'Cuenta en zona pre-castigo. Si no responde en 15 días, traslado a jurídica.' },
    ],
  },
  {
    id: 'C-1009',
    nombre: 'Diana Patricia Vega',
    email: 'diana.vega@correo.com',
    telefono: '+57 319 7766554',
    fechaVinculacion: '2016-04-08',
    deudaTotal: 32500000,
    diasMora: 0,
    ultimoPago: '2026-05-20',
    riesgo: 'Bajo',
    estado: 'Al día',
    comportamientoPago: 'Cliente premium con 10 años de relación. Pago siempre adelantado.',
    ultimosPagos: [
      { fecha: '2026-05-20', monto: 1850000 },
      { fecha: '2026-04-20', monto: 1850000 },
      { fecha: '2026-03-20', monto: 1850000 },
      { fecha: '2026-02-20', monto: 1850000 },
      { fecha: '2026-01-20', monto: 1850000 },
    ],
    productos: [
      { tipo: 'Crédito hipotecario', monto: 28000000 },
      { tipo: 'Tarjeta Gold', monto: 4500000 },
    ],
    estrategia: {
      tipo: 'Perfilamiento',
      resumen: 'Upgrade a Tarjeta Platinum + cashback 3%.',
    },
    notas: [],
  },
  {
    id: 'C-1010',
    nombre: 'Carlos Eduardo Niño',
    email: 'carlos.nino@correo.com',
    telefono: '+57 314 5544332',
    fechaVinculacion: '2022-03-15',
    deudaTotal: 3200000,
    diasMora: 22,
    ultimoPago: '2026-04-12',
    riesgo: 'Bajo',
    estado: 'En mora',
    comportamientoPago: 'Buen historial general, atraso ocasional sin patrón.',
    ultimosPagos: [
      { fecha: '2026-04-12', monto: 380000 },
      { fecha: '2026-03-08', monto: 380000 },
      { fecha: '2026-02-10', monto: 380000 },
      { fecha: '2026-01-08', monto: 380000 },
      { fecha: '2025-12-10', monto: 380000 },
    ],
    productos: [
      { tipo: 'Crédito de consumo', monto: 3200000 },
    ],
    estrategia: null,
    notas: [],
  },
  {
    id: 'C-1011',
    nombre: 'Juan Sebastián Morales',
    email: 'juan.morales@correo.com',
    telefono: '+57 316 8877665',
    fechaVinculacion: '2024-02-01',
    deudaTotal: 600000,
    diasMora: 0,
    ultimoPago: '2026-05-21',
    riesgo: 'Bajo',
    estado: 'Al día',
    comportamientoPago: 'Cliente joven, pagador puntual con potencial de crecimiento.',
    ultimosPagos: [
      { fecha: '2026-05-21', monto: 120000 },
      { fecha: '2026-04-20', monto: 120000 },
      { fecha: '2026-03-19', monto: 120000 },
      { fecha: '2026-02-18', monto: 120000 },
      { fecha: '2026-01-20', monto: 120000 },
    ],
    productos: [
      { tipo: 'Microcrédito', monto: 600000 },
    ],
    estrategia: {
      tipo: 'Perfilamiento',
      resumen: 'Oferta de crédito educativo para posgrado con periodo de gracia.',
    },
    notas: [],
  },
  {
    id: 'C-1012',
    nombre: 'Marcela Hernández Ruiz',
    email: 'marcela.hernandez@correo.com',
    telefono: '+57 321 1122334',
    fechaVinculacion: '2023-07-08',
    deudaTotal: 1100000,
    diasMora: 8,
    ultimoPago: '2026-04-22',
    riesgo: 'Bajo',
    estado: 'En mora',
    comportamientoPago: 'Primera mora en 2 años. Probable olvido, no patrón.',
    ultimosPagos: [
      { fecha: '2026-04-22', monto: 145000 },
      { fecha: '2026-03-20', monto: 145000 },
      { fecha: '2026-02-22', monto: 145000 },
      { fecha: '2026-01-21', monto: 145000 },
      { fecha: '2025-12-20', monto: 145000 },
    ],
    productos: [
      { tipo: 'Crédito rotativo', monto: 1100000 },
    ],
    estrategia: {
      tipo: 'Recuperación',
      resumen: 'SMS suave + link de pago en 1 clic. Sin tono cobratorio.',
    },
    notas: [],
  },
  {
    id: 'C-1013',
    nombre: 'Esteban Camilo Ardila',
    email: 'esteban.ardila@correo.com',
    telefono: '+57 322 5566778',
    fechaVinculacion: '2015-05-22',
    deudaTotal: 48000000,
    diasMora: 0,
    ultimoPago: '2026-05-10',
    riesgo: 'Medio',
    estado: 'Al día',
    comportamientoPago: 'Cliente de alto monto, ha tenido moras puntuales en últimos 6 meses.',
    ultimosPagos: [
      { fecha: '2026-05-10', monto: 2200000 },
      { fecha: '2026-04-10', monto: 2200000 },
      { fecha: '2026-03-08', monto: 2200000 },
      { fecha: '2026-02-12', monto: 2200000 },
      { fecha: '2026-01-10', monto: 2200000 },
    ],
    productos: [
      { tipo: 'Crédito hipotecario', monto: 42000000 },
      { tipo: 'Crédito vehicular', monto: 6000000 },
    ],
    estrategia: null,
    notas: [
      { id: 1, autor: 'Catalina Ríos', fecha: '2026-04-15', texto: 'Monitorear, ha mostrado señales de inestabilidad de flujo.' },
    ],
  },
  {
    id: 'C-1014',
    nombre: 'Liliana Castro Méndez',
    email: 'liliana.castro@correo.com',
    telefono: '+57 323 9988776',
    fechaVinculacion: '2019-12-04',
    deudaTotal: 0,
    diasMora: 180,
    ultimoPago: '2025-11-04',
    riesgo: 'Alto',
    estado: 'Castigada',
    comportamientoPago: 'Cuenta castigada. Sin gestión activa, traslado a cobranza externa.',
    ultimosPagos: [
      { fecha: '2025-11-04', monto: 320000 },
      { fecha: '2025-10-04', monto: 320000 },
      { fecha: '2025-09-04', monto: 320000 },
      { fecha: '2025-08-04', monto: 320000 },
      { fecha: '2025-07-04', monto: 320000 },
    ],
    productos: [
      { tipo: 'Crédito de consumo', monto: 0 },
    ],
    estrategia: null,
    notas: [
      { id: 1, autor: 'Sistema', fecha: '2026-04-04', texto: 'Cuenta castigada por +180 días. Trasladada a cobranza externa.' },
    ],
  },
  {
    id: 'C-1015',
    nombre: 'Mauricio Bermúdez Lara',
    email: 'mauricio.bermudez@correo.com',
    telefono: '+57 324 1112233',
    fechaVinculacion: '2020-10-15',
    deudaTotal: 7400000,
    diasMora: 75,
    ultimoPago: '2026-03-05',
    riesgo: 'Alto',
    estado: 'En mora',
    comportamientoPago: 'Promesas de pago incumplidas en últimos 3 meses.',
    ultimosPagos: [
      { fecha: '2026-03-05', monto: 620000 },
      { fecha: '2026-01-28', monto: 620000 },
      { fecha: '2025-12-15', monto: 620000 },
      { fecha: '2025-11-08', monto: 620000 },
      { fecha: '2025-10-05', monto: 620000 },
    ],
    productos: [
      { tipo: 'Crédito de consumo', monto: 7400000 },
    ],
    estrategia: {
      tipo: 'Recuperación',
      resumen: 'Visita domiciliaria + propuesta de acuerdo con codeudor.',
    },
    notas: [
      { id: 1, autor: 'Andrés Mejía', fecha: '2026-05-01', texto: 'Cliente prometió pago el 5 de mayo, no cumplió.' },
    ],
  },
  {
    id: 'C-1016',
    nombre: 'Natalia Quintero Ríos',
    email: 'natalia.quintero@correo.com',
    telefono: '+57 325 4455667',
    fechaVinculacion: '2024-08-10',
    deudaTotal: 950000,
    diasMora: 0,
    ultimoPago: '2026-05-17',
    riesgo: 'Bajo',
    estado: 'Al día',
    comportamientoPago: 'Cliente nuevo con excelente comportamiento inicial.',
    ultimosPagos: [
      { fecha: '2026-05-17', monto: 145000 },
      { fecha: '2026-04-15', monto: 145000 },
      { fecha: '2026-03-18', monto: 145000 },
      { fecha: '2026-02-17', monto: 145000 },
      { fecha: '2026-01-15', monto: 145000 },
    ],
    productos: [
      { tipo: 'Crédito rotativo', monto: 950000 },
    ],
    estrategia: null,
    notas: [],
  },
  {
    id: 'C-1017',
    nombre: 'Hernán Daniel Sosa',
    email: 'hernan.sosa@correo.com',
    telefono: '+57 326 8899001',
    fechaVinculacion: '2021-12-01',
    deudaTotal: 12500000,
    diasMora: 38,
    ultimoPago: '2026-04-02',
    riesgo: 'Medio',
    estado: 'En mora',
    comportamientoPago: 'Cliente independiente, ingresos variables. Responde a contacto telefónico.',
    ultimosPagos: [
      { fecha: '2026-04-02', monto: 920000 },
      { fecha: '2026-03-03', monto: 920000 },
      { fecha: '2026-02-01', monto: 920000 },
      { fecha: '2026-01-02', monto: 920000 },
      { fecha: '2025-12-02', monto: 920000 },
    ],
    productos: [
      { tipo: 'Crédito libre inversión', monto: 12500000 },
    ],
    estrategia: null,
    notas: [],
  },
];
