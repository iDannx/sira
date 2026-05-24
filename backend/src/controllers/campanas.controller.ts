import { Request, Response, NextFunction } from 'express';
import { query } from '../db';

const num = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

interface ResumenRow {
  total_campanas: string;
  campanas_activas: string;
  tasa_contacto: string | null;
  monto_recuperado: string | null;
}

// GET /api/campanas/resumen
// 4 KPIs para el header de la vista Campañas. Se calculan en paralelo y
// luego se combinan en una sola respuesta.
export const getResumen = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalsResult, tasaResult, montoResult] = await Promise.all([
      query<{ total_campanas: string; campanas_activas: string }>(
        `SELECT
           COUNT(*)::text                                  AS total_campanas,
           COUNT(*) FILTER (WHERE estado = 'ACTIVA')::text AS campanas_activas
         FROM cartera.mcp_estrategias`,
      ),
      query<{ tasa_contacto: string | null }>(
        `SELECT
           ROUND(
             COUNT(*) FILTER (WHERE resultado IN ('enviado','promesa_pago')) * 100.0
             / NULLIF(COUNT(*), 0),
             1
           )::text AS tasa_contacto
         FROM cartera.mcp_gestiones
         WHERE created_at >= NOW() - INTERVAL '30 days'`,
      ),
      query<{ monto_recuperado: string | null }>(
        `SELECT COALESCE(SUM(p.valor_pagado), 0)::text AS monto_recuperado
         FROM cartera.pagos p
         JOIN cartera.mcp_gestiones g ON g.id_credito = p.id_credito
         JOIN cartera.mcp_estrategias e ON e.id = g.estrategia_id
         WHERE e.estado = 'ACTIVA'
           AND p.fecha_pago >= NOW() - INTERVAL '30 days'
           AND g.created_at >= NOW() - INTERVAL '30 days'`,
      ),
    ]);

    const row: ResumenRow = {
      total_campanas: totalsResult.rows[0]?.total_campanas ?? '0',
      campanas_activas: totalsResult.rows[0]?.campanas_activas ?? '0',
      tasa_contacto: tasaResult.rows[0]?.tasa_contacto ?? null,
      monto_recuperado: montoResult.rows[0]?.monto_recuperado ?? null,
    };

    res.json({
      success: true,
      data: {
        totalCampanas:      num(row.total_campanas),
        campanasActivas:    num(row.campanas_activas),
        tasaContacto:       num(row.tasa_contacto),
        montoRecuperado30d: Math.round(num(row.monto_recuperado)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/campanas/generar
// Stub: dispara la generación de campañas vía agente IA. La implementación
// real se conectará cuando el agente esté disponible.
export const generarCampana = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Generación de campaña iniciada por el agente IA',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};
