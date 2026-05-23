import { query } from '../db';

let cached: { value: string; expires: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export const getLatestCorte = async (): Promise<string> => {
  const now = Date.now();
  if (cached && cached.expires > now) return cached.value;

  const { rows } = await query<{ fecha_corte: string | Date | null }>(
    'SELECT MAX(fecha_corte) AS fecha_corte FROM cartera.cartera',
  );
  const raw = rows[0]?.fecha_corte;
  if (!raw) {
    throw new Error('No hay cortes de cartera disponibles');
  }
  const value = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
  cached = { value, expires: now + TTL_MS };
  return value;
};

export const getPreviousCorte = async (current: string): Promise<string | null> => {
  const { rows } = await query<{ fecha_corte: string | Date }>(
    'SELECT MAX(fecha_corte) AS fecha_corte FROM cartera.cartera WHERE fecha_corte < $1',
    [current],
  );
  const raw = rows[0]?.fecha_corte;
  if (!raw) return null;
  return raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
};

export const invalidateCorteCache = () => {
  cached = null;
};
