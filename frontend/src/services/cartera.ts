import api from './api';
import type { ApiSuccess, PageMeta } from '../types/api';
import type {
  ClienteCartera,
  NivelRiesgo,
  EstadoCartera,
  NotaGestion,
  EstrategiaAsignada,
} from '../data/carteraMock';

export interface ResumenCartera {
  total: number;
  vencida: number;
  alDia: number;
  recuperadoMes: number;
  tendencias: {
    total: string;
    vencida: string;
    alDia: string;
    recuperadoMes: string;
  };
  ultimaActualizacion: string;
}

export interface ClienteListItem {
  id: string;
  nombre: string;
  deudaTotal: number;
  diasMora: number;
  ultimoPago: string | null;
  riesgo: NivelRiesgo;
  estado: EstadoCartera;
}

export interface ListClientesParams {
  page?: number;
  limit?: number;
  search?: string;
  riesgo?: NivelRiesgo;
  estado?: EstadoCartera;
  rangoMora?: '1-30' | '31-60' | '61-90' | '+90';
  sortBy?: 'nombre' | 'deudaTotal' | 'diasMora' | 'ultimoPago' | 'riesgo' | 'estado';
  sortDir?: 'asc' | 'desc';
}

export async function getResumenCartera(): Promise<ResumenCartera> {
  const { data } = await api.get<ApiSuccess<ResumenCartera>>('/cartera/resumen');
  return data.data;
}

export async function listClientesCartera(
  params: ListClientesParams = {},
): Promise<{ items: ClienteListItem[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<ClienteListItem[]>>('/cartera/clientes', {
    params,
  });
  const meta = data.meta ?? { total: data.data.length, page: 1, limit: data.data.length, totalPages: 1 };
  return { items: data.data, meta };
}

export async function getClienteCartera(id: string): Promise<ClienteCartera> {
  const { data } = await api.get<ApiSuccess<ClienteCartera>>(`/cartera/clientes/${id}`);
  return data.data;
}

export async function crearNotaCartera(
  id: string,
  texto: string,
): Promise<NotaGestion> {
  const { data } = await api.post<ApiSuccess<NotaGestion>>(`/cartera/clientes/${id}/notas`, {
    texto,
  });
  return data.data;
}

export async function generarEstrategiaCartera(
  id: string,
): Promise<EstrategiaAsignada> {
  const { data } = await api.post<ApiSuccess<EstrategiaAsignada>>(
    `/cartera/clientes/${id}/estrategia`,
  );
  return data.data;
}
