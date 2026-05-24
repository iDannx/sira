import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { getLatestCorte, getPreviousCorte } from '../utils/carteraCache';

const pct = (current: number, previous: number): string => {
  if (!previous || previous === 0) {
    if (!current) return '+0%';
    return '+100%';
  }
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
};

const num = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

interface SnapshotStats {
  cartera_total: string | null;
  cartera_vencida: string | null;
  cartera_al_dia: string | null;
}

const fetchSnapshot = async (fechaCorte: string): Promise<SnapshotStats> => {
  const { rows } = await query<SnapshotStats>(
    `SELECT
       SUM(saldo_total)                                       AS cartera_total,
       SUM(saldo_total) FILTER (WHERE calificacion <> 'A')    AS cartera_vencida,
       SUM(saldo_total) FILTER (WHERE calificacion = 'A')     AS cartera_al_dia
     FROM cartera.cartera
     WHERE fecha_corte = $1`,
    [fechaCorte],
  );
  return rows[0] ?? { cartera_total: null, cartera_vencida: null, cartera_al_dia: null };
};

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const fechaCorte = await getLatestCorte();
    const prevCorte = await getPreviousCorte(fechaCorte);

    const current = await fetchSnapshot(fechaCorte);
    const previous = prevCorte ? await fetchSnapshot(prevCorte) : null;

    const { rows: [recRow] } = await query<{ recuperacion_mes: string }>(
      `SELECT COALESCE(SUM(valor_pagado), 0)::text AS recuperacion_mes
         FROM cartera.pagos
        WHERE DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)`,
    );
    const { rows: [recPrevRow] } = await query<{ recuperacion_mes: string }>(
      `SELECT COALESCE(SUM(valor_pagado), 0)::text AS recuperacion_mes
         FROM cartera.pagos
        WHERE DATE_TRUNC('month', fecha_pago)
              = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')`,
    );

    const carteraTotal = num(current.cartera_total);
    const carteraVencida = num(current.cartera_vencida);
    const carteraAlDia = num(current.cartera_al_dia);
    const recuperacionMes = num(recRow?.recuperacion_mes);

    const prevTotal = num(previous?.cartera_total);
    const prevVencida = num(previous?.cartera_vencida);
    const prevAlDia = num(previous?.cartera_al_dia);
    const prevRec = num(recPrevRow?.recuperacion_mes);

    res.json({
      success: true,
      data: {
        carteraTotal,
        carteraVencida,
        carteraAlDia,
        recuperacionMes,
        fechaCorte,
        tendencias: {
          carteraTotal: pct(carteraTotal, prevTotal),
          carteraVencida: pct(carteraVencida, prevVencida),
          carteraAlDia: pct(carteraAlDia, prevAlDia),
          recuperacionMes: pct(recuperacionMes, prevRec),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDistribucionCartera = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const fechaCorte = await getLatestCorte();
    const { rows } = await query<{
      categoria: string;
      monto: string;
      porcentaje: string;
    }>(
      `SELECT calificacion AS categoria,
              SUM(saldo_total)::text AS monto,
              ROUND(SUM(saldo_total) * 100.0 / NULLIF(SUM(SUM(saldo_total)) OVER (), 0), 2)::text AS porcentaje
         FROM cartera.cartera
        WHERE fecha_corte = $1
        GROUP BY calificacion
        ORDER BY calificacion`,
      [fechaCorte],
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        categoria: r.categoria,
        monto: num(r.monto),
        porcentaje: num(r.porcentaje),
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getEvolucionRecuperacion = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { rows } = await query<{ fecha: string; valor: string }>(
      `SELECT TO_CHAR(DATE_TRUNC('month', fecha_pago), 'YYYY-MM') AS fecha,
              SUM(valor_pagado)::text AS valor
         FROM cartera.pagos
        WHERE fecha_pago >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', fecha_pago)
        ORDER BY DATE_TRUNC('month', fecha_pago)`,
    );

    res.json({
      success: true,
      data: rows.map((r) => ({ fecha: r.fecha, valor: num(r.valor) })),
    });
  } catch (err) {
    next(err);
  }
};

export const getRiesgoDesercion = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const fechaCorte = await getLatestCorte();
    const prevCorte = await getPreviousCorte(fechaCorte);

    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE calificacion = 'E')              AS alto,
        COUNT(*) FILTER (WHERE calificacion IN ('C','D'))       AS medio,
        COUNT(*) FILTER (WHERE calificacion IN ('A','B'))       AS bajo,
        COUNT(*)                                                AS total
      FROM cartera.cartera
      WHERE fecha_corte = $1
    `;

    const { rows: [curr] } = await query<{
      alto: string;
      medio: string;
      bajo: string;
      total: string;
    }>(sql, [fechaCorte]);

    let prev: { alto: number; medio: number; bajo: number } = { alto: 0, medio: 0, bajo: 0 };
    if (prevCorte) {
      const { rows: [r] } = await query<{
        alto: string;
        medio: string;
        bajo: string;
      }>(sql, [prevCorte]);
      prev = { alto: num(r?.alto), medio: num(r?.medio), bajo: num(r?.bajo) };
    }

    const alto = num(curr?.alto);
    const medio = num(curr?.medio);
    const bajo = num(curr?.bajo);
    const total = num(curr?.total) || 1;

    res.json({
      success: true,
      data: {
        altoRiesgo: {
          cantidad: alto,
          porcentaje: Number(((alto / total) * 100).toFixed(2)),
          tendencia: pct(alto, prev.alto),
        },
        medioRiesgo: {
          cantidad: medio,
          porcentaje: Number(((medio / total) * 100).toFixed(2)),
          tendencia: pct(medio, prev.medio),
        },
        bajoRiesgo: {
          cantidad: bajo,
          porcentaje: Number(((bajo / total) * 100).toFixed(2)),
          tendencia: pct(bajo, prev.bajo),
        },
        totalMonitoreados: num(curr?.total),
        fechaCorte,
      },
    });
  } catch (err) {
    next(err);
  }
};
