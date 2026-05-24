import api from './api';
import type { ApiSuccess } from '../types/api';
import type {
  ClientePerfilamiento as ClientePerfilamientoBase,
  ClienteRecuperacion as ClienteRecuperacionBase,
} from '../data/estrategiasMock';

// El backend devuelve además idCliente / idCredito (UUIDs) que necesitamos
// para llamar a POST /api/estrategias/:idCredito/aplicar.
export interface ClientePerfilamientoApi extends ClientePerfilamientoBase {
  idCliente: string;
  idCredito: string;
}

export interface ClienteRecuperacionApi extends ClienteRecuperacionBase {
  idCliente: string;
  idCredito: string;
  telefono: string | null;
  email: string | null;
  numeroCredito: string;
  tipoCredito: string;
  saldoMoraReal: number;
  saldoCapital: number;
  estadoJuridico: string | null;
}

export async function getPerfilamiento(): Promise<ClientePerfilamientoApi[]> {
  const { data } = await api.get<ApiSuccess<ClientePerfilamientoApi[]>>(
    '/estrategias/perfilamiento',
  );
  return data.data;
}

export async function getRecuperacion(): Promise<ClienteRecuperacionApi[]> {
  const { data } = await api.get<ApiSuccess<ClienteRecuperacionApi[]>>(
    '/estrategias/recuperacion',
  );
  return data.data;
}

export async function generarEstrategias(): Promise<{ message: string; timestamp: string }> {
  const { data } = await api.post<ApiSuccess<{ message: string; timestamp: string }>>(
    '/estrategias/generar',
  );
  return data.data;
}

export async function aplicarEstrategia(
  idCredito: string,
  tipo: 'perfilamiento' | 'recuperacion',
): Promise<{ id: number; aplicada: boolean }> {
  const { data } = await api.post<ApiSuccess<{ id: number; aplicada: boolean }>>(
    `/estrategias/${idCredito}/aplicar`,
    { tipo },
  );
  return data.data;
}
