import api from './api';
import type {
  ApiSuccess,
  Automatizacion,
  AutomatizacionEjecucion,
} from '../types/api';

export async function listAutomatizaciones(): Promise<Automatizacion[]> {
  const { data } = await api.get<ApiSuccess<Automatizacion[]>>('/automatizaciones');
  return data.data;
}

export async function ejecutarAutomatizacion(id: number): Promise<AutomatizacionEjecucion> {
  const { data } = await api.post<ApiSuccess<AutomatizacionEjecucion>>(
    `/automatizaciones/${id}/ejecutar`
  );
  return data.data;
}

export async function toggleAutomatizacion(id: number): Promise<Automatizacion> {
  const { data } = await api.put<ApiSuccess<Automatizacion>>(`/automatizaciones/${id}/toggle`);
  return data.data;
}
