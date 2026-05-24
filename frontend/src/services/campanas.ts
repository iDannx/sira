// Service de Campañas. Bajo el capó usa los mismos endpoints de
// /api/automatizaciones porque ambas vistas leen la tabla mcp_estrategias.
// Se separa como módulo propio para que, si el backend expone /api/campanas
// más adelante, sólo haya que cambiar el path aquí.

import api from './api';
import type { ApiSuccess } from '../types/api';
import type {
  CampanaListItem,
  CampanaDetalle,
} from '../data/campanasMock';

export async function listCampanas(): Promise<CampanaListItem[]> {
  const { data } = await api.get<ApiSuccess<CampanaListItem[]>>('/automatizaciones');
  return data.data;
}

export async function getCampanaDetalle(id: number): Promise<CampanaDetalle> {
  const { data } = await api.get<ApiSuccess<CampanaDetalle>>(`/automatizaciones/${id}`);
  return data.data;
}

export async function toggleCampana(id: number): Promise<CampanaListItem> {
  const { data } = await api.put<ApiSuccess<CampanaListItem>>(`/automatizaciones/${id}/toggle`);
  return data.data;
}
