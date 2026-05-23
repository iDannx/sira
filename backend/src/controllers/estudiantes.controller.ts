import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { badRequest, notFound } from '../utils/httpError';
import { assertUuid, parsePagination, pickAllowed } from '../utils/validate';
import { getLatestCorte } from '../utils/carteraCache';

const RIESGO_MAP: Record<string, string[]> = {
  alto: ['E'],
  medio: ['C', 'D'],
  bajo: ['A', 'B'],
};

export const listEstudiantes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fechaCorte = await getLatestCorte();
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const riesgo = typeof req.query.riesgo === 'string' ? req.query.riesgo.toLowerCase() : null;
    const estadoCredito = typeof req.query.estado === 'string' ? req.query.estado : null;
    const tipoCredito = typeof req.query.tipo_credito === 'string' ? req.query.tipo_credito : null;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : null;

    const where: string[] = ['c.fecha_corte = $1'];
    const params: unknown[] = [fechaCorte];

    if (riesgo && RIESGO_MAP[riesgo]) {
      params.push(RIESGO_MAP[riesgo]);
      where.push(`c.calificacion = ANY($${params.length}::text[])`);
    }
    if (estadoCredito) {
      params.push(estadoCredito);
      where.push(`cr.estado = $${params.length}`);
    }
    if (tipoCredito) {
      params.push(tipoCredito);
      where.push(`cr.tipo_credito = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const i = params.length;
      where.push(
        `(cl.numero_documento ILIKE $${i}
          OR cl.primer_nombre ILIKE $${i}
          OR cl.primer_apellido ILIKE $${i}
          OR cl.razon_social ILIKE $${i})`,
      );
    }

    const whereSql = where.join(' AND ');

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT
        cl.id_cliente,
        cl.tipo_documento,
        cl.numero_documento,
        cl.tipo_cliente,
        cl.primer_nombre,
        cl.primer_apellido,
        cl.razon_social,
        cl.ciudad,
        cl.departamento,
        cl.telefono_celular,
        cl.email,
        cl.estado AS estado_cliente,
        cr.id_credito,
        cr.numero_credito,
        cr.tipo_credito,
        cr.estado AS estado_credito,
        cr.monto_desembolsado,
        cr.valor_cuota,
        c.calificacion,
        c.dias_mora,
        c.saldo_total,
        c.cuotas_mora,
        COUNT(*) OVER() AS total_count
      FROM cartera.cartera c
      JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      WHERE ${whereSql}
      ORDER BY c.saldo_total DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await query<Record<string, unknown> & { total_count: string }>(sql, params);
    const total = rows[0] ? Number(rows[0].total_count) : 0;

    const data = rows.map((r) => {
      const { total_count: _t, ...rest } = r;
      return rest;
    });

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

export const getEstudiante = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = assertUuid(req.params.id, 'id');
    const fechaCorte = await getLatestCorte();

    const { rows: clienteRows } = await query(
      `SELECT * FROM cartera.clientes WHERE id_cliente = $1`,
      [id],
    );
    if (clienteRows.length === 0) throw notFound('Cliente no encontrado');
    const cliente = clienteRows[0];

    const { rows: creditos } = await query(
      `SELECT
         cr.id_credito,
         cr.numero_credito,
         cr.tipo_credito,
         cr.estado,
         cr.monto_desembolsado,
         cr.plazo_meses,
         cr.tasa_interes_ea,
         cr.valor_cuota,
         cr.fecha_desembolso,
         cr.fecha_primera_cuota,
         cr.fecha_ultima_cuota,
         c.calificacion,
         c.dias_mora,
         c.cuotas_mora,
         c.saldo_capital,
         c.saldo_intereses,
         c.saldo_mora,
         c.saldo_total,
         c.estado_juridico,
         c.fecha_ultimo_pago,
         c.fecha_venc_prox_cuota
       FROM cartera.creditos cr
       LEFT JOIN cartera.cartera c
         ON c.id_credito = cr.id_credito
        AND c.fecha_corte = $2
       WHERE cr.id_cliente = $1
       ORDER BY cr.fecha_desembolso DESC`,
      [id, fechaCorte],
    );

    const { rows: gestiones } = await query(
      `SELECT g.id, g.id_credito, g.canal, g.resultado,
              g.valor_promesa, g.fecha_promesa, g.notas, g.created_at,
              cr.numero_credito
         FROM cartera.mcp_gestiones g
         JOIN cartera.creditos cr ON cr.id_credito = g.id_credito
        WHERE cr.id_cliente = $1
        ORDER BY g.created_at DESC
        LIMIT 5`,
      [id],
    );

    res.json({
      success: true,
      data: {
        cliente,
        creditos,
        gestiones,
        fechaCorte,
      },
    });
  } catch (err) {
    next(err);
  }
};

const UPDATABLE_FIELDS = [
  'telefono_celular',
  'telefono_fijo',
  'email',
  'direccion',
  'ciudad',
  'departamento',
  'estado',
] as const;

export const updateEstudiante = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = assertUuid(req.params.id, 'id');
    const updates = pickAllowed(req.body ?? {}, UPDATABLE_FIELDS);

    const keys = Object.keys(updates);
    if (keys.length === 0) throw badRequest('No hay campos válidos para actualizar');

    const setClauses: string[] = [];
    const params: unknown[] = [];
    keys.forEach((k, i) => {
      params.push((updates as Record<string, unknown>)[k]);
      setClauses.push(`${k} = $${i + 1}`);
    });
    setClauses.push(`fecha_actualizacion = NOW()`);
    params.push(id);

    const sql = `
      UPDATE cartera.clientes
         SET ${setClauses.join(', ')}
       WHERE id_cliente = $${params.length}
       RETURNING *
    `;

    const { rows } = await query(sql, params);
    if (rows.length === 0) throw notFound('Cliente no encontrado');

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};
