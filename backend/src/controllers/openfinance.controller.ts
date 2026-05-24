import { Request, Response } from 'express';

// El schema `openfinance` fue eliminado de la base de datos. Las rutas siguen
// montadas en server.ts para no romper consumidores del frontend, pero todos
// los handlers devuelven una respuesta vacía sin tocar la DB.
//
// Cuando el módulo de Open Finance vuelva a existir, restaurar la lógica
// real en cada handler.

const empty = (_req: Request, res: Response): void => {
  res.json({ success: true, data: [] });
};

export const listInstituciones = empty;
export const listConsentimientos = empty;
export const createConsentimiento = empty;
export const revokeConsentimiento = empty;
export const getPerfil = empty;
export const getCuentas = empty;
export const listPropuestas = empty;
export const createPropuesta = empty;
export const aceptarPropuesta = empty;
export const getInversiones = empty;
export const getSeguros = empty;
export const getPagosIniciados = empty;
