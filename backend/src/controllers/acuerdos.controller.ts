import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { badRequest, notFound } from '../utils/httpError';
import { assertUuid, parsePagination, pickAllowed } from '../utils/validate';

const PROMESA = 'promesa_pago';

export const listAcuerdos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const canal = typeof req.query.canal === 'string' ? req.query.canal : null;

    const where: string[] = [`g.resultado = $1`];
    const params: unknown[] = [PROMESA];
    if (canal) {
      params.push(canal);
      where.push(`g.canal = $${params.length}`);
    }

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT
        g.id,
        g.id_credito,
        g.canal,
        g.resultado,
        g.valor_promesa,
        g.fecha_promesa,
        g.notas,
        g.created_at,
        cr.numero_credito,
        cl.id_cliente,
        cl.primer_nombre,
        cl.primer_apellido,
        cl.numero_documento,
        COUNT(*) OVER() AS total_count
      FROM cartera.mcp_gestiones g
      JOIN cartera.creditos cr ON cr.id_credito = g.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      WHERE ${where.join(' AND ')}
      ORDER BY g.fecha_promesa ASC NULLS LAST, g.created_at DESC
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
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      throw badRequest('id inválido');
    }

    const { rows } = await query(
      `SELECT g.*,
              cr.numero_credito, cr.tipo_credito,
              cl.id_cliente, cl.primer_nombre, cl.primer_apellido,
              cl.numero_documento, cl.telefono_celular, cl.email
         FROM cartera.mcp_gestiones g
         JOIN cartera.creditos cr ON cr.id_credito = g.id_credito
         JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
        WHERE g.id = $1`,
      [idNum],
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
    const fecha_promesa = body.fecha_promesa;
    if (typeof fecha_promesa !== 'string') {
      throw badRequest('fecha_promesa es requerida (YYYY-MM-DD)');
    }
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

    const { rows } = await query(
      `INSERT INTO cartera.mcp_gestiones (id_credito, canal, resultado, valor_promesa, fecha_promesa, notas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id_credito, canal, PROMESA, valor_promesa, fecha_promesa, notas],
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

const UPDATABLE = ['notas', 'fecha_promesa', 'valor_promesa', 'canal'] as const;

export const updateAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      throw badRequest('id inválido');
    }
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
    params.push(idNum);

    const sql = `
      UPDATE cartera.mcp_gestiones
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
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      throw badRequest('id inválido');
    }
    const { rowCount } = await query(
      `DELETE FROM cartera.mcp_gestiones WHERE id = $1`,
      [idNum],
    );
    if (!rowCount) throw notFound('Acuerdo no encontrado');
    res.json({ success: true, data: { message: 'Acuerdo eliminado' } });
  } catch (err) {
    next(err);
  }
};
