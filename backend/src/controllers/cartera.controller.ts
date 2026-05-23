import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { assertUuid, parsePagination } from '../utils/validate';
import { getLatestCorte } from '../utils/carteraCache';

export const listCartera = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const calificacion =
      typeof req.query.calificacion === 'string' ? req.query.calificacion.toUpperCase() : null;
    const estadoJuridico =
      typeof req.query.estado_juridico === 'string' ? req.query.estado_juridico : null;
    const fechaCorteParam =
      typeof req.query.fecha_corte === 'string' ? req.query.fecha_corte : null;

    const fechaCorte = fechaCorteParam ?? (await getLatestCorte());

    const where: string[] = ['c.fecha_corte = $1'];
    const params: unknown[] = [fechaCorte];

    if (calificacion) {
      params.push(calificacion);
      where.push(`c.calificacion = $${params.length}`);
    }
    if (estadoJuridico) {
      params.push(estadoJuridico);
      where.push(`c.estado_juridico = $${params.length}`);
    }

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT
        c.id_cartera,
        c.id_credito,
        c.fecha_corte,
        c.saldo_capital,
        c.saldo_intereses,
        c.saldo_mora,
        c.saldo_total,
        c.dias_mora,
        c.cuotas_mora,
        c.calificacion,
        c.tasa_provision,
        c.provision_requerida,
        c.fecha_ultimo_pago,
        c.fecha_venc_prox_cuota,
        c.estado_juridico,
        cr.numero_credito,
        cr.tipo_credito,
        cl.id_cliente,
        cl.numero_documento,
        cl.primer_nombre,
        cl.primer_apellido,
        cl.razon_social,
        COUNT(*) OVER() AS total_count
      FROM cartera.cartera c
      JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      WHERE ${where.join(' AND ')}
      ORDER BY c.saldo_total DESC
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

export const getHistorialCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = assertUuid(req.params.estudianteId, 'estudianteId');

    const { rows } = await query(
      `SELECT
         c.fecha_corte,
         c.calificacion,
         c.dias_mora,
         c.saldo_capital,
         c.saldo_intereses,
         c.saldo_mora,
         c.saldo_total,
         c.provision_requerida,
         c.estado_juridico,
         cr.id_credito,
         cr.numero_credito,
         cr.tipo_credito
       FROM cartera.cartera c
       JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
       WHERE cr.id_cliente = $1
       ORDER BY c.fecha_corte DESC, cr.numero_credito`,
      [id],
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
