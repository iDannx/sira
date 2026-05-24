// Datos mock para la vista de Gestiones. Se reemplazará por API real
// (ver lista de backend al final de la PR).

export type CanalGestion = 'WhatsApp' | 'Llamada' | 'Email';
export type ResultadoGestion = 'enviado' | 'promesa_pago' | 'no_contesta' | 'rechazado';
export type OrigenGestion = 'Manual' | 'Automatizada';
export type Calificacion = 'A' | 'B' | 'C' | 'D' | 'E';
export type EstadoJuridico =
  | 'SIN_PROCESO'
  | 'PREJURIDICO'
  | 'JURIDICO'
  | 'ACUERDO_PAGO'
  | 'SENTENCIA'
  | 'EMBARGO';

export interface Gestion {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  ingresosMensuales: number;
  numeroCredito: string;
  canal: CanalGestion;
  resultado: ResultadoGestion;
  calificacion: Calificacion;
  diasMora: number;
  saldoTotal: number;
  estadoJuridico: EstadoJuridico;
  origen: OrigenGestion;
  estrategiaAsociada: string | null;
  fecha: string;
  notas: string;
  // Para resultado = 'promesa_pago':
  valorPrometido: number | null;
  fechaPromesa: string | null;
  cumplida: boolean | null; // null si aún no vence
  // Para créditos en proceso jurídico:
  abogadoAsignado: string | null;
}

export const gestionesMock: Gestion[] = [
  {
    id: 'G-3001', clienteId: 'C-1004', clienteNombre: 'Sandra Milena Vargas',
    clienteTelefono: '+57 312 3456789', clienteEmail: 'sandra.vargas@correo.com',
    ingresosMensuales: 3_800_000, numeroCredito: 'CR-50012',
    canal: 'Llamada', resultado: 'promesa_pago', calificacion: 'C', diasMora: 45,
    saldoTotal: 4_200_000, estadoJuridico: 'PREJURIDICO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-04-18',
    notas: 'Cliente acepta plan en 3 cuotas con primera al firmar.',
    valorPrometido: 1_400_000, fechaPromesa: '2026-05-30', cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3002', clienteId: 'C-1007', clienteNombre: 'Jorge Luis Mendoza',
    clienteTelefono: '+57 311 9988776', clienteEmail: 'jorge.mendoza@correo.com',
    ingresosMensuales: 5_200_000, numeroCredito: 'CR-50034',
    canal: 'WhatsApp', resultado: 'enviado', calificacion: 'C', diasMora: 62,
    saldoTotal: 6_300_000, estadoJuridico: 'PREJURIDICO',
    origen: 'Automatizada', estrategiaAsociada: 'Llamada prioritaria mora media',
    fecha: '2026-04-20',
    notas: 'Mensaje automático con simulador de fraccionamiento.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3003', clienteId: 'C-1008', clienteNombre: 'Patricia Ortega Suárez',
    clienteTelefono: '+57 317 4433221', clienteEmail: 'patricia.ortega@correo.com',
    ingresosMensuales: 7_500_000, numeroCredito: 'CR-50045',
    canal: 'Email', resultado: 'rechazado', calificacion: 'E', diasMora: 130,
    saldoTotal: 15_800_000, estadoJuridico: 'JURIDICO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-04-22',
    notas: 'Cliente rechaza propuesta. Trasladado al área jurídica.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: 'Dra. Mónica Pacheco',
  },
  {
    id: 'G-3004', clienteId: 'C-1003', clienteNombre: 'Pedro Antonio Salas',
    clienteTelefono: '+57 315 6789012', clienteEmail: 'pedro.salas@correo.com',
    ingresosMensuales: 2_400_000, numeroCredito: 'CR-50056',
    canal: 'WhatsApp', resultado: 'enviado', calificacion: 'B', diasMora: 15,
    saldoTotal: 850_000, estadoJuridico: 'SIN_PROCESO',
    origen: 'Automatizada', estrategiaAsociada: 'Recuperación temprana WhatsApp',
    fecha: '2026-04-26',
    notas: 'Recordatorio amistoso enviado.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3005', clienteId: 'C-1015', clienteNombre: 'Mauricio Bermúdez Lara',
    clienteTelefono: '+57 324 1112233', clienteEmail: 'mauricio.bermudez@correo.com',
    ingresosMensuales: 4_100_000, numeroCredito: 'CR-50067',
    canal: 'Llamada', resultado: 'no_contesta', calificacion: 'D', diasMora: 75,
    saldoTotal: 7_400_000, estadoJuridico: 'PREJURIDICO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-04-28',
    notas: '3er intento fallido en la semana. Probar otro horario.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3006', clienteId: 'C-1023', clienteNombre: 'Walter Aníbal Caro',
    clienteTelefono: '+57 331 9988776', clienteEmail: 'walter.caro@correo.com',
    ingresosMensuales: 6_200_000, numeroCredito: 'CR-50078',
    canal: 'Email', resultado: 'enviado', calificacion: 'E', diasMora: 88,
    saldoTotal: 9_100_000, estadoJuridico: 'JURIDICO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-04-29',
    notas: 'Correo certificado del jefe de cartera con propuesta de acuerdo.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: 'Dr. Iván Restrepo',
  },
  {
    id: 'G-3007', clienteId: 'C-1024', clienteNombre: 'Liliana Castro Méndez',
    clienteTelefono: '+57 323 9988776', clienteEmail: 'liliana.castro@correo.com',
    ingresosMensuales: 0, numeroCredito: 'CR-50089',
    canal: 'Llamada', resultado: 'no_contesta', calificacion: 'E', diasMora: 145,
    saldoTotal: 6_300_000, estadoJuridico: 'EMBARGO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-05-02',
    notas: 'Sin respuesta hace 90 días. Embargo en curso.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: 'Dra. Mónica Pacheco',
  },
  {
    id: 'G-3008', clienteId: 'C-1018', clienteNombre: 'Catalina Restrepo Vargas',
    clienteTelefono: '+57 327 4455667', clienteEmail: 'catalina.restrepo@correo.com',
    ingresosMensuales: 4_800_000, numeroCredito: 'CR-50090',
    canal: 'WhatsApp', resultado: 'promesa_pago', calificacion: 'C', diasMora: 38,
    saldoTotal: 1_900_000, estadoJuridico: 'ACUERDO_PAGO',
    origen: 'Automatizada', estrategiaAsociada: 'Acuerdo descuento intereses',
    fecha: '2026-05-03',
    notas: 'Confirmó pago de última cuota.',
    valorPrometido: 633_000, fechaPromesa: '2026-05-20', cumplida: true,
    abogadoAsignado: null,
  },
  {
    id: 'G-3009', clienteId: 'C-1010', clienteNombre: 'Carlos Eduardo Niño',
    clienteTelefono: '+57 314 5544332', clienteEmail: 'carlos.nino@correo.com',
    ingresosMensuales: 5_500_000, numeroCredito: 'CR-50101',
    canal: 'WhatsApp', resultado: 'promesa_pago', calificacion: 'B', diasMora: 22,
    saldoTotal: 3_200_000, estadoJuridico: 'SIN_PROCESO',
    origen: 'Automatizada', estrategiaAsociada: 'Recuperación temprana WhatsApp',
    fecha: '2026-05-05',
    notas: 'Promesa generada por bot conversacional.',
    valorPrometido: 380_000, fechaPromesa: '2026-05-28', cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3010', clienteId: 'C-1025', clienteNombre: 'Carlos Hernando Salgado',
    clienteTelefono: '+57 332 5544332', clienteEmail: 'carlos.salgado@correo.com',
    ingresosMensuales: 3_400_000, numeroCredito: 'CR-50112',
    canal: 'Llamada', resultado: 'promesa_pago', calificacion: 'D', diasMora: 95,
    saldoTotal: 3_900_000, estadoJuridico: 'PREJURIDICO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-05-08',
    notas: 'Promesa de pago, último intento antes de jurídica.',
    valorPrometido: 780_000, fechaPromesa: '2026-05-22', cumplida: false,
    abogadoAsignado: null,
  },
  {
    id: 'G-3011', clienteId: 'C-1019', clienteNombre: 'Nicolás Andrés Pinzón',
    clienteTelefono: '+57 328 7788990', clienteEmail: 'nicolas.pinzon@correo.com',
    ingresosMensuales: 6_800_000, numeroCredito: 'CR-50123',
    canal: 'WhatsApp', resultado: 'enviado', calificacion: 'A', diasMora: 0,
    saldoTotal: 3_500_000, estadoJuridico: 'SIN_PROCESO',
    origen: 'Automatizada', estrategiaAsociada: 'Compra de cartera externa',
    fecha: '2026-05-10',
    notas: 'Oferta cross-sell enviada.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3012', clienteId: 'C-1002', clienteNombre: 'Andrés Felipe Gómez',
    clienteTelefono: '+57 320 7891245', clienteEmail: 'andres.gomez@correo.com',
    ingresosMensuales: 11_500_000, numeroCredito: 'CR-50134',
    canal: 'Email', resultado: 'enviado', calificacion: 'A', diasMora: 0,
    saldoTotal: 18_750_000, estadoJuridico: 'SIN_PROCESO',
    origen: 'Automatizada', estrategiaAsociada: 'Cross-sell tarjeta Gold',
    fecha: '2026-05-12',
    notas: 'Landing personalizada de crédito libre inversión.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3013', clienteId: 'C-1017', clienteNombre: 'Hernán Daniel Sosa',
    clienteTelefono: '+57 326 8899001', clienteEmail: 'hernan.sosa@correo.com',
    ingresosMensuales: 7_200_000, numeroCredito: 'CR-50145',
    canal: 'Llamada', resultado: 'promesa_pago', calificacion: 'C', diasMora: 38,
    saldoTotal: 12_500_000, estadoJuridico: 'ACUERDO_PAGO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-05-14',
    notas: 'Acuerdo firmado por SMS con débito automático.',
    valorPrometido: 1_180_000, fechaPromesa: '2026-06-05', cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3014', clienteId: 'C-1027', clienteNombre: 'Ximena Gutiérrez Páez',
    clienteTelefono: '+57 333 4455667', clienteEmail: 'ximena.gutierrez@correo.com',
    ingresosMensuales: 0, numeroCredito: 'CR-50156',
    canal: 'Email', resultado: 'no_contesta', calificacion: 'E', diasMora: 120,
    saldoTotal: 6_800_000, estadoJuridico: 'EMBARGO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-05-15',
    notas: 'Cliente reportado fuera del país.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: 'Dr. Iván Restrepo',
  },
  {
    id: 'G-3015', clienteId: 'C-1012', clienteNombre: 'Marcela Hernández Ruiz',
    clienteTelefono: '+57 321 1122334', clienteEmail: 'marcela.hernandez@correo.com',
    ingresosMensuales: 2_900_000, numeroCredito: 'CR-50167',
    canal: 'WhatsApp', resultado: 'enviado', calificacion: 'B', diasMora: 8,
    saldoTotal: 1_100_000, estadoJuridico: 'SIN_PROCESO',
    origen: 'Automatizada', estrategiaAsociada: 'Recuperación temprana WhatsApp',
    fecha: '2026-05-17',
    notas: 'SMS suave + link de pago en 1 clic.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3016', clienteId: 'C-1005', clienteNombre: 'Ricardo Andrés Lozano',
    clienteTelefono: '+57 318 1112233', clienteEmail: 'ricardo.lozano@correo.com',
    ingresosMensuales: 8_400_000, numeroCredito: 'CR-50178',
    canal: 'Email', resultado: 'promesa_pago', calificacion: 'E', diasMora: 95,
    saldoTotal: 9_800_000, estadoJuridico: 'JURIDICO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-05-18',
    notas: 'Aceptó descuento 40% en intereses moratorios.',
    valorPrometido: 3_500_000, fechaPromesa: '2026-05-26', cumplida: null,
    abogadoAsignado: 'Dra. Mónica Pacheco',
  },
  {
    id: 'G-3017', clienteId: 'C-1028', clienteNombre: 'Eduardo Antonio Pérez',
    clienteTelefono: '+57 334 5566778', clienteEmail: 'eduardo.perez@correo.com',
    ingresosMensuales: 0, numeroCredito: 'CR-50189',
    canal: 'Llamada', resultado: 'rechazado', calificacion: 'E', diasMora: 105,
    saldoTotal: 11_500_000, estadoJuridico: 'SENTENCIA',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-05-19',
    notas: 'Insolvencia. Reestructuración con quita rechazada.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: 'Dr. Iván Restrepo',
  },
  {
    id: 'G-3018', clienteId: 'C-1009', clienteNombre: 'Diana Patricia Vega',
    clienteTelefono: '+57 319 7766554', clienteEmail: 'diana.vega@correo.com',
    ingresosMensuales: 18_000_000, numeroCredito: 'CR-50190',
    canal: 'Email', resultado: 'enviado', calificacion: 'A', diasMora: 0,
    saldoTotal: 32_500_000, estadoJuridico: 'SIN_PROCESO',
    origen: 'Automatizada', estrategiaAsociada: 'Cross-sell tarjeta Gold',
    fecha: '2026-05-20',
    notas: 'Oferta upgrade a tarjeta Platinum.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3019', clienteId: 'C-1004', clienteNombre: 'Sandra Milena Vargas',
    clienteTelefono: '+57 312 3456789', clienteEmail: 'sandra.vargas@correo.com',
    ingresosMensuales: 3_800_000, numeroCredito: 'CR-50012',
    canal: 'WhatsApp', resultado: 'enviado', calificacion: 'C', diasMora: 45,
    saldoTotal: 4_200_000, estadoJuridico: 'PREJURIDICO',
    origen: 'Automatizada', estrategiaAsociada: 'Llamada prioritaria mora media',
    fecha: '2026-05-21',
    notas: 'Recordatorio próximo a vencimiento promesa.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3020', clienteId: 'C-1029', clienteNombre: 'Catalina Riveros Mejía',
    clienteTelefono: '+57 335 8877665', clienteEmail: 'catalina.riveros@correo.com',
    ingresosMensuales: 2_100_000, numeroCredito: 'CR-50201',
    canal: 'Llamada', resultado: 'promesa_pago', calificacion: 'D', diasMora: 92,
    saldoTotal: 5_400_000, estadoJuridico: 'JURIDICO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-05-21',
    notas: 'Promesa condicionada a liquidación laboral.',
    valorPrometido: 5_400_000, fechaPromesa: '2026-08-15', cumplida: null,
    abogadoAsignado: 'Dra. Mónica Pacheco',
  },
  {
    id: 'G-3021', clienteId: 'C-1014', clienteNombre: 'Liliana Castro Méndez',
    clienteTelefono: '+57 323 9988776', clienteEmail: 'liliana.castro@correo.com',
    ingresosMensuales: 0, numeroCredito: 'CR-50212',
    canal: 'Email', resultado: 'rechazado', calificacion: 'E', diasMora: 180,
    saldoTotal: 4_200_000, estadoJuridico: 'EMBARGO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-05-22',
    notas: 'Cuenta castigada. Traslado a cobranza externa.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: 'Dr. Iván Restrepo',
  },
  {
    id: 'G-3022', clienteId: 'C-1006', clienteNombre: 'Laura Stefanía Pérez',
    clienteTelefono: '+57 313 5566778', clienteEmail: 'laura.perez@correo.com',
    ingresosMensuales: 4_600_000, numeroCredito: 'CR-50223',
    canal: 'WhatsApp', resultado: 'enviado', calificacion: 'A', diasMora: 0,
    saldoTotal: 1_500_000, estadoJuridico: 'SIN_PROCESO',
    origen: 'Automatizada', estrategiaAsociada: 'Compra de cartera externa',
    fecha: '2026-05-23',
    notas: 'Aumento de cupo automático notificado.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: null,
  },
  {
    id: 'G-3023', clienteId: 'C-1030', clienteNombre: 'Bernardo Antonio Sosa',
    clienteTelefono: '+57 336 7788990', clienteEmail: 'bernardo.sosa@correo.com',
    ingresosMensuales: 3_900_000, numeroCredito: 'CR-50234',
    canal: 'Llamada', resultado: 'no_contesta', calificacion: 'E', diasMora: 165,
    saldoTotal: 12_800_000, estadoJuridico: 'JURIDICO',
    origen: 'Manual', estrategiaAsociada: null,
    fecha: '2026-05-23',
    notas: 'Cliente reincidente, sin respuesta. Carta jurídica enviada.',
    valorPrometido: null, fechaPromesa: null, cumplida: null,
    abogadoAsignado: 'Dra. Mónica Pacheco',
  },
];
