// Tipos compartidos de Gestiones. Los datos reales vienen del backend
// vía services/gestiones.ts. Se conservan los tipos aquí para que el
// service y la vista los importen sin duplicación.

export type CanalGestion = 'whatsapp' | 'llamada' | 'email' | 'sms';
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

export interface GestionHistorial {
  id: number;
  canal: CanalGestion;
  resultado: ResultadoGestion;
  valorPrometido: number | null;
  fechaPromesa: string | null;
  notas: string;
  fecha: string;
}

export interface Gestion {
  id: number;
  idCredito: string;
  numeroCredito: string;
  tipoCredito: string;
  nombre: string;
  canal: CanalGestion;
  resultado: ResultadoGestion;
  calificacion: Calificacion;
  diasMora: number;
  estadoJuridico: EstadoJuridico;
  origen: OrigenGestion;
  estrategiaAsociada: string | null;
  ingresosMensuales: number;
  notas: string;
  fecha: string;
  // Solo si resultado = 'promesa_pago'
  valorPrometido: number | null;
  fechaPromesa: string | null;
  cumplida: boolean;
  // Solo presentes en ciertos endpoints
  saldoTotal?: number;
  abogadoAsignado?: string | null;
  historial?: GestionHistorial[];
}
