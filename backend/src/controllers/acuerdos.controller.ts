import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { badRequest, notFound } from '../utils/httpError';
import { assertUuid, parsePagination, pickAllowed } from '../utils/validate';

// Un "acuerdo" es un contacto cuyo resultado es promesa de pago. La fuente
// principal es `cartera.mcp_contactos` (incluye mensaje enviado y respuesta);
// `cartera.mcp_gestiones` se conserva como registro simplificado/legado.
const PROMESA = 'promesa_pago';

const parseId = (raw: string | undefined): number => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest('id inválido');
  }
  return n;
};

export const listAcuerdos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const canal = typeof req.query.canal === 'string' ? req.query.canal : null;
    const estrategiaId = req.query.estrategia_id !== undefined
      ? Number(req.query.estrategia_id)
      : null;

    const where: string[] = [`c.resultado = $1`];
    const params: unknown[] = [PROMESA];
    if (canal) {
      params.push(canal);
      where.push(`c.canal = $${params.length}`);
    }
    if (estrategiaId !== null && Number.isInteger(estrategiaId) && estrategiaId > 0) {
      params.push(estrategiaId);
      where.push(`c.estrategia_id = $${params.length}`);
    }

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT
        c.id,
        c.id_credito,
        c.estrategia_id,
        c.canal,
        c.resultado,
        c.mensaje_enviado,
        c.respuesta,
        c.valor_promesa,
        c.fecha_promesa,
        c.notas,
        c.created_at,
        cr.numero_credito,
        cl.id_cliente,
        cl.primer_nombre,
        cl.primer_apellido,
        cl.numero_documento,
        COUNT(*) OVER() AS total_count
      FROM cartera.mcp_contactos c
      JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      WHERE ${where.join(' AND ')}
      ORDER BY c.fecha_promesa ASC NULLS LAST, c.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await query<Record<string, unknown> & { total_count: string }>(sql, params);
    const total = rows[0] ? Number(rows[0].total_count) : 0;
    const data = rows.map(({ total_count: _t, ...rest }) => rest);

    res.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);

    const { rows } = await query(
      `SELECT c.*,
              cr.numero_credito, cr.tipo_credito,
              cl.id_cliente, cl.primer_nombre, cl.primer_apellido,
              cl.numero_documento, cl.telefono_celular, cl.email
         FROM cartera.mcp_contactos c
         JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
         JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
        WHERE c.id = $1`,
      [id],
    );

    if (rows.length === 0) throw notFound('Acuerdo no encontrado');
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const createAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body ?? {};
    const id_credito = assertUuid(body.id_credito, 'id_credito');

    const valor_promesa = Number(body.valor_promesa);
    if (!Number.isFinite(valor_promesa) || valor_promesa <= 0) {
      throw badRequest('valor_promesa debe ser un número mayor a 0');
    }

    if (typeof body.fecha_promesa !== 'string') {
      throw badRequest('fecha_promesa es requerida (YYYY-MM-DD)');
    }
    const fecha_promesa = body.fecha_promesa;
    const promiseDate = new Date(fecha_promesa);
    if (Number.isNaN(promiseDate.getTime())) {
      throw badRequest('fecha_promesa inválida');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (promiseDate < today) {
      throw badRequest('fecha_promesa debe ser una fecha futura');
    }

    const canal = typeof body.canal === 'string' ? body.canal : 'manual';
    const notas = typeof body.notas === 'string' ? body.notas : null;
    const mensaje_enviado = typeof body.mensaje_enviado === 'string' ? body.mensaje_enviado : null;
    const estrategia_id =
      body.estrategia_id !== undefined && body.estrategia_id !== null
        ? Number(body.estrategia_id)
        : null;
    if (estrategia_id !== null && (!Number.isInteger(estrategia_id) || estrategia_id <= 0)) {
      throw badRequest('estrategia_id debe ser un entero positivo');
    }

    const { rows } = await query(
      `INSERT INTO cartera.mcp_contactos
         (id_credito, estrategia_id, canal, resultado, mensaje_enviado,
          valor_promesa, fecha_promesa, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id_credito,
        estrategia_id,
        canal,
        PROMESA,
        mensaje_enviado,
        valor_promesa,
        fecha_promesa,
        notas,
      ],
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

const UPDATABLE = ['notas', 'fecha_promesa', 'valor_promesa', 'respuesta'] as const;

export const updateAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);
    const updates = pickAllowed(req.body ?? {}, UPDATABLE);
    const keys = Object.keys(updates);
    if (keys.length === 0) throw badRequest('No hay campos válidos para actualizar');

    if (updates.valor_promesa !== undefined) {
      const v = Number(updates.valor_promesa);
      if (!Number.isFinite(v) || v <= 0) {
        throw badRequest('valor_promesa debe ser un número mayor a 0');
      }
      updates.valor_promesa = v;
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];
    keys.forEach((k, i) => {
      params.push((updates as Record<string, unknown>)[k]);
      setClauses.push(`${k} = $${i + 1}`);
    });
    params.push(id);

    const sql = `
      UPDATE cartera.mcp_contactos
         SET ${setClauses.join(', ')}
       WHERE id = $${params.length}
       RETURNING *
    `;
    const { rows } = await query(sql, params);
    if (rows.length === 0) throw notFound('Acuerdo no encontrado');

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);
    const { rowCount } = await query(
      `DELETE FROM cartera.mcp_contactos WHERE id = $1`,
      [id],
    );
    if (!rowCount) throw notFound('Acuerdo no encontrado');
    res.json({ success: true, data: { message: 'Acuerdo eliminado' } });
  } catch (err) {
    next(err);
  }
};
