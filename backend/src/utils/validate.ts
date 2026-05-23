import { badRequest } from './httpError';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && UUID_RE.test(v);

export const assertUuid = (v: unknown, field = 'id'): string => {
  if (!isUuid(v)) throw badRequest(`${field} no es un UUID válido`, 'INVALID_UUID');
  return v;
};

export const isEmail = (v: unknown): v is string =>
  typeof v === 'string' && EMAIL_RE.test(v);

export const parsePagination = (q: Record<string, unknown>) => {
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(q.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const pickAllowed = <T extends Record<string, unknown>>(
  body: T,
  allowed: readonly string[],
): Partial<T> => {
  const out: Partial<T> = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined) {
      (out as Record<string, unknown>)[k] = body[k];
    }
  }
  return out;
};
