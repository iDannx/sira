import api from './api';
import type {
  ApiSuccess,
  DashboardStats,
  DistribucionCarteraItem,
  EvolucionRecuperacionItem,
  RiesgoDesercion,
} from '../types/api';

export async function getStats(): Promise<DashboardStats> {
  const { data } = await api.get<ApiSuccess<DashboardStats>>('/dashboard/stats');
  return data.data;
}

export async function getDistribucionCartera(): Promise<DistribucionCarteraItem[]> {
  const { data } = await api.get<ApiSuccess<DistribucionCarteraItem[]>>(
    '/dashboard/distribucion-cartera'
  );
  return data.data;
}

export async function getEvolucionRecuperacion(): Promise<EvolucionRecuperacionItem[]> {
  const { data } = await api.get<ApiSuccess<EvolucionRecuperacionItem[]>>(
    '/dashboard/evolucion-recuperacion'
  );
  return data.data;
}

export async function getRiesgoDesercion(): Promise<RiesgoDesercion> {
  const { data } = await api.get<ApiSuccess<RiesgoDesercion>>('/dashboard/riesgo-desercion');
  return data.data;
}
