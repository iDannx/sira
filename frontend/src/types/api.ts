// Shared API contract types (mirror of API_DOCUMENTACION.md).

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Auth ──────────────────────────────────────────────
export type UserRole = 'admin' | 'gestor' | 'consulta';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ── Dashboard ─────────────────────────────────────────
export interface DashboardStats {
  carteraTotal: number;
  carteraVencida: number;
  carteraAlDia: number;
  recuperacionMes: number;
  tendencias: {
    carteraTotal: string;
    carteraVencida: string;
    carteraAlDia: string;
    recuperacionMes: string;
  };
}

export type Calificacion = 'A' | 'B' | 'C' | 'D' | 'E';

export interface DistribucionCarteraItem {
  categoria: Calificacion;
  monto: number;
  porcentaje: number;
}

export interface EvolucionRecuperacionItem {
  fecha: string;
  valor: number;
}

export interface NivelRiesgo {
  cantidad: number;
  porcentaje: number;
  tendencia: string;
}

export interface RiesgoDesercion {
  totalMonitoreados: number;
  altoRiesgo: NivelRiesgo;
  medioRiesgo: NivelRiesgo;
  bajoRiesgo: NivelRiesgo;
}

// ── Campañas (mcp_estrategias) ────────────────────────
export type AutomatizacionEstado = 'BORRADOR' | 'ACTIVA' | 'PAUSADA' | 'COMPLETADA';

export interface AutomatizacionSegmento {
  calificaciones?: Calificacion[];
  dias_mora_min?: number;
  saldo_min?: number;
  tipo_credito?: string[];
  estado_juridico?: string[];
}
