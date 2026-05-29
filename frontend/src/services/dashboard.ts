import api from './api';
import type {
  ApiSuccess,
  DashboardStats,
  DistribucionCarteraItem,
  EvolucionRecuperacionItem,
  RiesgoDesercion,
  EstadoJuridicoItem,
  GestionEscenarioItem,
  AlertasAcademicas,
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

export async function getEstadoJuridico(): Promise<EstadoJuridicoItem[]> {
  const { data } = await api.get<ApiSuccess<EstadoJuridicoItem[]>>('/dashboard/estado-juridico');
  return data.data;
}

export async function getGestionActivaEscenario(): Promise<GestionEscenarioItem[]> {
  const { data } = await api.get<ApiSuccess<GestionEscenarioItem[]>>(
    '/dashboard/gestion-activa-escenario',
  );
  return data.data;
}

export async function getAlertasAcademicas(): Promise<AlertasAcademicas> {
  const { data } = await api.get<ApiSuccess<AlertasAcademicas>>('/dashboard/alertas-academicas');
  return data.data;
}
