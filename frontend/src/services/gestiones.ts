import api from './api';
import type { ApiSuccess, PageMeta } from '../types/api';
import type {
  Gestion,
  CanalGestion,
  ResultadoGestion,
  Calificacion,
  EstadoJuridico,
} from '../data/gestionesMock';

export interface ResumenGestiones {
  totalGestiones: number;
  promesasActivas: number;
  montoComprometido: number;
  tasaContacto: number;
  promesasProximasSemana: number;
}

export interface ListGestionesParams {
  page?: number;
  limit?: number;
  search?: string;
  canal?: CanalGestion;
  resultado?: ResultadoGestion;
  calificacion?: Calificacion;
  estadoJuridico?: EstadoJuridico;
  rangoFecha?: 'hoy' | 'semana' | 'mes';
  sortBy?: 'fecha' | 'canal' | 'resultado' | 'diasMora' | 'valor';
  sortDir?: 'asc' | 'desc';
}

export type EstadoPromesa = 'proximas' | 'vencidas' | 'cumplidas';

export interface CrearGestionBody {
  id_credito: string;
  canal: CanalGestion;
  resultado: ResultadoGestion;
  valor_promesa?: number | null;
  fecha_promesa?: string | null;
  notas?: string | null;
}

export async function getResumenGestiones(): Promise<ResumenGestiones> {
  const { data } = await api.get<ApiSuccess<ResumenGestiones>>('/gestiones/resumen');
  return data.data;
}

export async function listGestiones(
  params: ListGestionesParams = {},
): Promise<{ items: Gestion[]; meta: PageMeta }> {
  const { data } = await api.get<ApiSuccess<Gestion[]>>('/gestiones', { params });
  const meta = data.meta ?? {
    total: data.data.length,
    page: 1,
    limit: data.data.length,
    totalPages: 1,
  };
  return { items: data.data, meta };
}

export async function listPromesas(estado: EstadoPromesa): Promise<Gestion[]> {
  const { data } = await api.get<ApiSuccess<Gestion[]>>('/gestiones/promesas', {
    params: { estado },
  });
  return data.data;
}

export async function listJuridica(): Promise<Gestion[]> {
  const { data } = await api.get<ApiSuccess<Gestion[]>>('/gestiones/juridica');
  return data.data;
}

export async function getGestion(id: number): Promise<Gestion> {
  const { data } = await api.get<ApiSuccess<Gestion>>(`/gestiones/${id}`);
  return data.data;
}

export async function crearGestion(body: CrearGestionBody): Promise<Gestion> {
  const { data } = await api.post<ApiSuccess<Gestion>>('/gestiones', body);
  return data.data;
}
