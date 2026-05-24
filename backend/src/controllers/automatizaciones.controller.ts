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
      `SELECT id, estado, resultado, created_at
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
      segmento_config: string | null;
    }>(
      `SELECT id, nombre, segmento_config
         FROM cartera.mcp_estrategias
        WHERE id = $1`,
      [idNum],
    );
    if (estrategiaRows.length === 0) throw notFound('Estrategia no encontrada');

    const { rows: insertRows } = await query<{ id: number }>(
      `INSERT INTO cartera.mcp_automatizaciones (estrategia_id, estado, resultado)
       VALUES ($1, 'EJECUTANDO', NULL)
       RETURNING id`,
      [idNum],
    );
    const ejecucionId = insertRows[0].id;
    // NOTA: cuando el flujo externo (n8n u otro orquestador) cree gestiones
    // derivadas de esta ejecución, DEBE incluir `estrategia_id = idNum` al
    // insertar en cartera.mcp_gestiones para que /api/campanas/resumen pueda
    // atribuir correctamente la recuperación a esta campaña.

    const estadoFinal = 'COMPLETADA';
    const resultadoFinal: unknown = { enviados: 0, errores: 0 };

    const { rows: updated } = await query(
      `UPDATE cartera.mcp_automatizaciones
          SET estado = $1, resultado = $2
        WHERE id = $3
        RETURNING id, estrategia_id, estado, resultado, created_at`,
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

// =================================================================
// PUT /api/automatizaciones/:id  — actualizar metadatos
// =================================================================

const ESTADOS_VALIDOS = ['BORRADOR', 'ACTIVA', 'PAUSADA', 'COMPLETADA'] as const;

export const updateAutomatizacion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');

    const { nombre, descripcion, segmento_config, estado } = req.body ?? {};

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (typeof nombre === 'string') {
      updates.push(`nombre = $${idx++}`);
      params.push(nombre);
    }
    if (typeof descripcion === 'string') {
      updates.push(`descripcion = $${idx++}`);
      params.push(descripcion);
    }
    if (segmento_config !== undefined && segmento_config !== null) {
      updates.push(`segmento_config = $${idx++}`);
      params.push(
        typeof segmento_config === 'string'
          ? segmento_config
          : JSON.stringify(segmento_config),
      );
    }
    if (
      typeof estado === 'string' &&
      (ESTADOS_VALIDOS as readonly string[]).includes(estado)
    ) {
      updates.push(`estado = $${idx++}`);
      params.push(estado);
    }

    if (updates.length === 0) {
      throw badRequest('No hay campos válidos para actualizar', 'VALIDATION_ERROR');
    }

    params.push(idNum);
    const { rows } = await query(
      `UPDATE cartera.mcp_estrategias
          SET ${updates.join(', ')}
        WHERE id = $${idx}
        RETURNING id, nombre, descripcion, estado, segmento_config`,
      params,
    );

    if (rows.length === 0) throw notFound('Estrategia no encontrada');

    const data = rows[0] as Record<string, unknown>;
    data.segmento_config = parseJsonField(data.segmento_config);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// DELETE /api/automatizaciones/:id  — soft delete (archiva)
// =================================================================

export const deleteAutomatizacion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');

    const { rows } = await query(
      `UPDATE cartera.mcp_estrategias
          SET estado = 'COMPLETADA'
        WHERE id = $1
        RETURNING id, nombre, estado`,
      [idNum],
    );
    if (rows.length === 0) throw notFound('Estrategia no encontrada');

    res.json({
      success: true,
      data: { message: 'Estrategia archivada correctamente', ...rows[0] },
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// POST /api/automatizaciones/:id/publicar  — BORRADOR → ACTIVA
// =================================================================

export const publicarAutomatizacion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');

    const { rows } = await query(
      `UPDATE cartera.mcp_estrategias
          SET estado = 'ACTIVA'
        WHERE id = $1 AND estado = 'BORRADOR'
        RETURNING id, nombre, estado`,
      [idNum],
    );
    if (rows.length === 0) {
      throw badRequest(
        'Solo se pueden publicar estrategias en estado BORRADOR',
        'INVALID_STATE',
      );
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// POST /api/automatizaciones/:id/cerrar  — ACTIVA → COMPLETADA
// =================================================================

export const cerrarAutomatizacion = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');

    const { rows } = await query(
      `UPDATE cartera.mcp_estrategias
          SET estado = 'COMPLETADA'
        WHERE id = $1 AND estado = 'ACTIVA'
        RETURNING id, nombre, estado`,
      [idNum],
    );
    if (rows.length === 0) {
      throw badRequest(
        'Solo se pueden cerrar estrategias en estado ACTIVA',
        'INVALID_STATE',
      );
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// CRUD de acciones — cartera.mcp_estrategias_acciones
// =================================================================

const CANALES_ACCION_VALIDOS = ['whatsapp', 'llamada', 'email', 'sms'] as const;

export const createAccion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');

    const { tipo, orden, espera_horas, config } = req.body ?? {};
    if (
      typeof tipo !== 'string' ||
      !(CANALES_ACCION_VALIDOS as readonly string[]).includes(tipo)
    ) {
      throw badRequest(
        `tipo debe ser uno de: ${CANALES_ACCION_VALIDOS.join(', ')}`,
        'INVALID_TIPO',
      );
    }
    const ordenNum = Number(orden);
    if (!Number.isInteger(ordenNum) || ordenNum <= 0) {
      throw badRequest('orden debe ser un entero positivo');
    }
    const esperaNum = espera_horas === undefined ? 24 : Number(espera_horas);
    if (!Number.isFinite(esperaNum) || esperaNum < 0) {
      throw badRequest('espera_horas debe ser un número >= 0');
    }

    const { rows } = await query(
      `INSERT INTO cartera.mcp_estrategias_acciones
         (estrategia_id, tipo, orden, espera_horas, config)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, estrategia_id, tipo, orden, espera_horas, config`,
      [idNum, tipo, ordenNum, esperaNum, JSON.stringify(config ?? {})],
    );
    const accion = rows[0] as Record<string, unknown>;
    accion.config = parseJsonField(accion.config);
    res.status(201).json({ success: true, data: accion });
  } catch (err) {
    next(err);
  }
};

export const updateAccion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idNum = Number(req.params.id);
    const accionIdNum = Number(req.params.accionId);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');
    if (!Number.isInteger(accionIdNum) || accionIdNum <= 0) {
      throw badRequest('accionId inválido');
    }

    const { tipo, orden, espera_horas, config } = req.body ?? {};

    if (
      tipo !== undefined &&
      (typeof tipo !== 'string' ||
        !(CANALES_ACCION_VALIDOS as readonly string[]).includes(tipo))
    ) {
      throw badRequest(
        `tipo debe ser uno de: ${CANALES_ACCION_VALIDOS.join(', ')}`,
        'INVALID_TIPO',
      );
    }

    const { rows } = await query(
      `UPDATE cartera.mcp_estrategias_acciones
          SET tipo         = COALESCE($1, tipo),
              orden        = COALESCE($2, orden),
              espera_horas = COALESCE($3, espera_horas),
              config       = COALESCE($4, config)
        WHERE id = $5 AND estrategia_id = $6
        RETURNING id, estrategia_id, tipo, orden, espera_horas, config`,
      [
        tipo ?? null,
        orden !== undefined ? Number(orden) : null,
        espera_horas !== undefined ? Number(espera_horas) : null,
        config !== undefined ? JSON.stringify(config) : null,
        accionIdNum,
        idNum,
      ],
    );
    if (rows.length === 0) throw notFound('Acción no encontrada');

    const accion = rows[0] as Record<string, unknown>;
    accion.config = parseJsonField(accion.config);
    res.json({ success: true, data: accion });
  } catch (err) {
    next(err);
  }
};

export const deleteAccion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idNum = Number(req.params.id);
    const accionIdNum = Number(req.params.accionId);
    if (!Number.isInteger(idNum) || idNum <= 0) throw badRequest('id inválido');
    if (!Number.isInteger(accionIdNum) || accionIdNum <= 0) {
      throw badRequest('accionId inválido');
    }

    const result = await query(
      `DELETE FROM cartera.mcp_estrategias_acciones
        WHERE id = $1 AND estrategia_id = $2`,
      [accionIdNum, idNum],
    );
    if (result.rowCount === 0) throw notFound('Acción no encontrada');

    res.json({ success: true, data: { message: 'Acción eliminada' } });
  } catch (err) {
    next(err);
  }
};
