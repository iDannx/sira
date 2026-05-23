import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { badRequest, notFound } from '../utils/httpError';

const parseJsonField = (val: unknown): unknown => {
  if (val == null) return null;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

interface EstrategiaRow {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  creada_por: string | null;
  segmento_config: string | null;
  created_at: Date;
  workflow_n8n_id: string | null;
  total_acciones: string;
  ultima_ejecucion: Date | null;
  ultimo_estado: string | null;
}

export const listAutomatizaciones = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { rows } = await query<EstrategiaRow>(
      `SELECT
         e.id,
         e.nombre,
         e.descripcion,
         e.estado,
         e.creada_por,
         e.segmento_config,
         e.created_at,
         e.workflow_n8n_id,
         COUNT(a.id)::text AS total_acciones,
         (SELECT MAX(aut.created_at)
            FROM cartera.mcp_automatizaciones aut
           WHERE aut.estrategia_id = e.id) AS ultima_ejecucion,
         (SELECT aut.estado
            FROM cartera.mcp_automatizaciones aut
           WHERE aut.estrategia_id = e.id
           ORDER BY aut.created_at DESC
           LIMIT 1) AS ultimo_estado
       FROM cartera.mcp_estrategias e
       LEFT JOIN cartera.mcp_estrategias_acciones a ON a.estrategia_id = e.id
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
    );

    const data = rows.map((r) => ({
      ...r,
      segmento_config: parseJsonField(r.segmento_config),
      total_acciones: Number(r.total_acciones),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getAutomatizacion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');

    const { rows: estrategias } = await query(
      `SELECT * FROM cartera.mcp_estrategias WHERE id = $1`,
      [idNum],
    );
    if (estrategias.length === 0) throw notFound('Estrategia no encontrada');

    const estrategia = estrategias[0] as Record<string, unknown>;
    estrategia.segmento_config = parseJsonField(estrategia.segmento_config);

    const { rows: acciones } = await query(
      `SELECT id, tipo, orden, config, espera_horas
         FROM cartera.mcp_estrategias_acciones
        WHERE estrategia_id = $1
        ORDER BY orden ASC`,
      [idNum],
    );

    const accionesParsed = acciones.map((a) => ({
      ...(a as Record<string, unknown>),
      config: parseJsonField((a as Record<string, unknown>).config),
    }));

    const { rows: ejecuciones } = await query(
      `SELECT id, workflow_n8n_id, estado, resultado, created_at
         FROM cartera.mcp_automatizaciones
        WHERE estrategia_id = $1
        ORDER BY created_at DESC
        LIMIT 10`,
      [idNum],
    );

    const ejecucionesParsed = ejecuciones.map((e) => ({
      ...(e as Record<string, unknown>),
      resultado: parseJsonField((e as Record<string, unknown>).resultado),
    }));

    res.json({
      success: true,
      data: { estrategia, acciones: accionesParsed, ejecuciones: ejecucionesParsed },
    });
  } catch (err) {
    next(err);
  }
};

export const ejecutarAutomatizacion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');

    const { rows: estrategiaRows } = await query<{
      id: number;
      nombre: string;
      workflow_n8n_id: string | null;
      segmento_config: string | null;
    }>(
      `SELECT id, nombre, workflow_n8n_id, segmento_config
         FROM cartera.mcp_estrategias
        WHERE id = $1`,
      [idNum],
    );
    if (estrategiaRows.length === 0) throw notFound('Estrategia no encontrada');
    const estrategia = estrategiaRows[0];

    const { rows: acciones } = await query(
      `SELECT id, tipo, orden, config, espera_horas
         FROM cartera.mcp_estrategias_acciones
        WHERE estrategia_id = $1
        ORDER BY orden ASC`,
      [idNum],
    );

    const { rows: insertRows } = await query<{ id: number }>(
      `INSERT INTO cartera.mcp_automatizaciones (estrategia_id, workflow_n8n_id, estado, resultado)
       VALUES ($1, $2, 'EJECUTANDO', NULL)
       RETURNING id`,
      [idNum, estrategia.workflow_n8n_id],
    );
    const ejecucionId = insertRows[0].id;

    const segmento = parseJsonField(estrategia.segmento_config);
    const accionesPayload = acciones.map((a) => ({
      ...(a as Record<string, unknown>),
      config: parseJsonField((a as Record<string, unknown>).config),
    }));

    let estadoFinal = 'COMPLETADA';
    let resultadoFinal: unknown = { enviados: 0, errores: 0 };

    if (estrategia.workflow_n8n_id) {
      try {
        const webhookBase = process.env.N8N_WEBHOOK_URL ?? '';
        if (!webhookBase) {
          throw new Error('N8N_WEBHOOK_URL no configurado');
        }
        const url = `${webhookBase.replace(/\/$/, '')}/${estrategia.workflow_n8n_id}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estrategia_id: idNum,
            nombre: estrategia.nombre,
            segmento,
            acciones: accionesPayload,
            ejecucion_id: ejecucionId,
          }),
        });
        if (!response.ok) {
          throw new Error(`n8n webhook respondió ${response.status}`);
        }
        const body = await response.json().catch(() => ({}));
        resultadoFinal = body && typeof body === 'object' ? body : { enviados: 0, errores: 0 };
      } catch (err) {
        estadoFinal = 'ERROR';
        resultadoFinal = { error: (err as Error).message };
      }
    }

    const { rows: updated } = await query(
      `UPDATE cartera.mcp_automatizaciones
          SET estado = $1, resultado = $2
        WHERE id = $3
        RETURNING id, estrategia_id, workflow_n8n_id, estado, resultado, created_at`,
      [estadoFinal, JSON.stringify(resultadoFinal), ejecucionId],
    );

    const ejecucion = updated[0] as Record<string, unknown>;
    ejecucion.resultado = parseJsonField(ejecucion.resultado);

    res.json({ success: true, data: ejecucion });
  } catch (err) {
    next(err);
  }
};

export const toggleAutomatizacion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');

    const { rows } = await query<{ estado: string }>(
      `SELECT estado FROM cartera.mcp_estrategias WHERE id = $1`,
      [idNum],
    );
    if (rows.length === 0) throw notFound('Estrategia no encontrada');

    const current = rows[0].estado;
    const next = current === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA';

    const { rows: updated } = await query(
      `UPDATE cartera.mcp_estrategias
          SET estado = $1
        WHERE id = $2
        RETURNING *`,
      [next, idNum],
    );

    const data = updated[0] as Record<string, unknown>;
    data.segmento_config = parseJsonField(data.segmento_config);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
