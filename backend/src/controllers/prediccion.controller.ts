import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { getLatestCorte } from '../utils/carteraCache';

const num = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const getEstudiantesRiesgo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const fechaCorte = await getLatestCorte();
    const limitParam = Number(req.query.limit);
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(500, Math.trunc(limitParam))
      : 100;

    const { rows } = await query<{
      id_cliente: string;
      nombre: string;
      telefono_celular: string | null;
      email: string | null;
      numero_credito: string;
      tipo_credito: string;
      calificacion: string;
      dias_mora: string;
      saldo_total: string;
      cuotas_mora: string;
      score_riesgo: string;
    }>(
      `SELECT
         cl.id_cliente,
         COALESCE(
           NULLIF(TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')), ''),
           cl.razon_social
         ) AS nombre,
         cl.telefono_celular,
         cl.email,
         cr.numero_credito,
         cr.tipo_credito,
         c.calificacion,
         c.dias_mora,
         c.saldo_total,
         c.cuotas_mora,
         (c.dias_mora * 0.4 + c.cuotas_mora * 20 +
            CASE c.calificacion
              WHEN 'E' THEN 100
              WHEN 'D' THEN 50
              WHEN 'C' THEN 20
              WHEN 'B' THEN 5
              ELSE 0
            END
         ) AS score_riesgo
       FROM cartera.cartera c
       JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
       JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
       WHERE c.fecha_corte = $1
         AND c.calificacion <> 'A'
       ORDER BY score_riesgo DESC
       LIMIT $2`,
      [fechaCorte, limit],
    );

    const data = rows.map((r) => ({
      id_cliente: r.id_cliente,
      nombre: r.nombre,
      telefono_celular: r.telefono_celular,
      email: r.email,
      numero_credito: r.numero_credito,
      tipo_credito: r.tipo_credito,
      calificacion: r.calificacion,
      dias_mora: num(r.dias_mora),
      saldo_total: num(r.saldo_total),
      cuotas_mora: num(r.cuotas_mora),
      score_riesgo: Number(num(r.score_riesgo).toFixed(2)),
    }));

    res.json({ success: true, data, meta: { total: data.length, fechaCorte } });
  } catch (err) {
    next(err);
  }
};

export const getProgramas = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const fechaCorte = await getLatestCorte();

    const { rows } = await query<{
      tipo_credito: string;
      total_creditos: string;
      en_riesgo: string;
      promedio_dias_mora: string;
      saldo_total: string;
      saldo_riesgo: string;
    }>(
      `SELECT
         cr.tipo_credito,
         COUNT(*)::text                                          AS total_creditos,
         COUNT(*) FILTER (WHERE c.calificacion IN ('D','E'))::text AS en_riesgo,
         ROUND(AVG(c.dias_mora), 1)::text                        AS promedio_dias_mora,
         SUM(c.saldo_total)::text                                AS saldo_total,
         COALESCE(SUM(c.saldo_total) FILTER (WHERE c.calificacion IN ('D','E')), 0)::text
           AS saldo_riesgo
       FROM cartera.cartera c
       JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
       WHERE c.fecha_corte = $1
       GROUP BY cr.tipo_credito
       ORDER BY saldo_riesgo DESC NULLS LAST`,
      [fechaCorte],
    );

    const data = rows.map((r) => {
      const total = num(r.total_creditos);
      const enRiesgo = num(r.en_riesgo);
      return {
        tipo_credito: r.tipo_credito,
        total_creditos: total,
        en_riesgo: enRiesgo,
        promedio_dias_mora: num(r.promedio_dias_mora),
        saldo_total: num(r.saldo_total),
        saldo_riesgo: num(r.saldo_riesgo),
        porcentaje_riesgo: total ? Number(((enRiesgo / total) * 100).toFixed(2)) : 0,
      };
    });

    res.json({ success: true, data, meta: { fechaCorte } });
  } catch (err) {
    next(err);
  }
};
