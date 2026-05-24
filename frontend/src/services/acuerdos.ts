import api from './api';
import type { ApiSuccess, PageMeta } from '../types/api';
import type {
  Acuerdo,
  EstadoAcuerdo,
  NotaSeguimiento,
} from '../data/acuerdosMock';

export interface ResumenAcuerdos {
  vigentes: number;
  cumplidosMes: number;
  incumplidos: number;
  montoComprometido: number;
}

export interface AcuerdoListItem {
  id: string;
  clienteId: string;
  clienteNombre: string;
  montoAcordado: number;
  cuotasPagadas: number;
  cuotasTotales: number;
  proximoPago: { fecha: string; monto: number } | null;
  cumplimiento: number;
  estado: EstadoAcuerdo;
}

export interface ListAcuerdosParams {
  page?: number;
  limit?: number;
  search?: string;
  estado?: EstadoAcuerdo;
  rangoFecha?: 'semana' | 'mes' | 'vencido';
  sortBy?: 'cliente' | 'monto' | 'cuotas' | 'proximoPago' | 'cumplimiento' | 'estado';
  sortDir?: 'asc' | 'desc';
}

export async function getResumenAcuerdos(): Promise<ResumenAcuerdos> {
  const { data } = await api.get<ApiSuccess<ResumenAcuerdos>>('/acuerdos/resumen');
  return data.data;
}

export async function listAcuerdos(
  params: ListAcuerdosParams = {},
): Promise<{ items: AcuerdoListItem[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<AcuerdoListItem[]>>('/acuerdos', { params });
  const meta = data.meta ?? { total: data.data.length, page: 1, limit: data.data.length, totalPages: 1 };
  return { items: data.data, meta };
}

export async function getAcuerdo(id: string): Promise<Acuerdo> {
  const { data } = await api.get<ApiSuccess<Acuerdo>>(`/acuerdos/${id}`);
  return data.data;
}

export async function registrarPagoAcuerdo(
  id: string,
  body: { monto: number; fecha: string },
): Promise<Acuerdo> {
  const { data } = await api.post<ApiSuccess<Acuerdo>>(`/acuerdos/${id}/pagos`, body);
  return data.data;
}

export async function marcarAcuerdoIncumplido(
  id: string,
  motivo?: string,
): Promise<Acuerdo> {
  const { data } = await api.post<ApiSuccess<Acuerdo>>(`/acuerdos/${id}/incumplir`, {
    motivo,
  });
  return data.data;
}

export async function crearNotaAcuerdo(
  id: string,
  texto: string,
): Promise<NotaSeguimiento> {
  const { data } = await api.post<ApiSuccess<NotaSeguimiento>>(`/acuerdos/${id}/notas`, {
    texto,
  });
  return data.data;
}
