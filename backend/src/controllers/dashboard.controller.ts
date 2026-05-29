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


const fmtPct = (v: string | null | undefined): string => {
  if (v === null || v === undefined) return '+0%';
  const n = Number(v);
  if (!Number.isFinite(n)) return '+0%';
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
};

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: [row] } = await query<{
      fecha_corte: string;
      cartera_total_m: string | null;
      cartera_total_var_pct: string | null;
      cartera_vencida_m: string | null;
      cartera_vencida_var_pct: string | null;
      cartera_al_dia_m: string | null;
      cartera_al_dia_var_pct: string | null;
      recuperacion_mes_m: string | null;
      recuperacion_var_pct: string | null;
      tasa_mora_pct: string | null;
    }>(
      `WITH
       corte_actual AS (
         SELECT MAX(fecha_corte) AS fecha FROM cartera.cartera
       ),
       corte_anterior AS (
         SELECT MAX(fecha_corte) AS fecha
         FROM cartera.cartera
         WHERE fecha_corte < (SELECT fecha FROM corte_actual)
       ),
       actual AS (
         SELECT
           SUM(ca.saldo_capital + ca.saldo_intereses)                         AS cartera_total,
           SUM(CASE WHEN ca.dias_mora > 0
                    THEN ca.saldo_capital + ca.saldo_intereses ELSE 0 END)    AS cartera_vencida,
           SUM(CASE WHEN ca.dias_mora = 0
                    THEN ca.saldo_capital + ca.saldo_intereses ELSE 0 END)    AS cartera_al_dia
         FROM cartera.cartera ca
         WHERE ca.fecha_corte = (SELECT fecha FROM corte_actual)
       ),
       anterior AS (
         SELECT
           SUM(ca.saldo_capital + ca.saldo_intereses)                         AS cartera_total,
           SUM(CASE WHEN ca.dias_mora > 0
                    THEN ca.saldo_capital + ca.saldo_intereses ELSE 0 END)    AS cartera_vencida,
           SUM(CASE WHEN ca.dias_mora = 0
                    THEN ca.saldo_capital + ca.saldo_intereses ELSE 0 END)    AS cartera_al_dia
         FROM cartera.cartera ca
         WHERE ca.fecha_corte = (SELECT fecha FROM corte_anterior)
       ),
       recuperacion AS (
         SELECT SUM(p.valor_pagado) AS recuperacion_mes
         FROM cartera.pagos p
         CROSS JOIN corte_actual ca
         WHERE DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', ca.fecha)
       ),
       recuperacion_anterior AS (
         SELECT SUM(p.valor_pagado) AS recuperacion_mes
         FROM cartera.pagos p
         CROSS JOIN corte_anterior ca
         WHERE DATE_TRUNC('month', p.fecha_pago) = DATE_TRUNC('month', ca.fecha)
       )
       SELECT
         (SELECT fecha FROM corte_actual)                                      AS fecha_corte,
         ROUND(a.cartera_total   / 1e6, 3)::text                              AS cartera_total_m,
         ROUND((a.cartera_total - ant.cartera_total)
               / NULLIF(ant.cartera_total, 0) * 100, 1)::text                 AS cartera_total_var_pct,
         ROUND(a.cartera_vencida / 1e6, 3)::text                              AS cartera_vencida_m,
         ROUND((a.cartera_vencida - ant.cartera_vencida)
               / NULLIF(ant.cartera_vencida, 0) * 100, 1)::text               AS cartera_vencida_var_pct,
         ROUND(a.cartera_al_dia  / 1e6, 3)::text                              AS cartera_al_dia_m,
         ROUND((a.cartera_al_dia - ant.cartera_al_dia)
               / NULLIF(ant.cartera_al_dia, 0) * 100, 1)::text                AS cartera_al_dia_var_pct,
         ROUND(r.recuperacion_mes / 1e6, 3)::text                             AS recuperacion_mes_m,
         ROUND((r.recuperacion_mes - ra.recuperacion_mes)
               / NULLIF(ra.recuperacion_mes, 0) * 100, 1)::text               AS recuperacion_var_pct,
         ROUND(a.cartera_vencida / NULLIF(a.cartera_total, 0) * 100, 1)::text AS tasa_mora_pct
       FROM actual a
       CROSS JOIN anterior ant
       CROSS JOIN recuperacion r
       CROSS JOIN recuperacion_anterior ra`,
    );

    res.json({
      success: true,
      data: {
        carteraTotal:    num(row?.cartera_total_m)    * 1_000_000,
        carteraVencida:  num(row?.cartera_vencida_m)  * 1_000_000,
        carteraAlDia:    num(row?.cartera_al_dia_m)   * 1_000_000,
        recuperacionMes: num(row?.recuperacion_mes_m) * 1_000_000,
        tasaMora:        num(row?.tasa_mora_pct),
        fechaCorte:      row?.fecha_corte,
        tendencias: {
          carteraTotal:    fmtPct(row?.cartera_total_var_pct),
          carteraVencida:  fmtPct(row?.cartera_vencida_var_pct),
          carteraAlDia:    fmtPct(row?.cartera_al_dia_var_pct),
          recuperacionMes: fmtPct(row?.recuperacion_var_pct),
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
    const { rows } = await query<{
      calificacion: string;
      descripcion: string;
      num_creditos: string;
      saldo: string;
      participacion_pct: string;
      var_vs_anterior_pct: string | null;
      cartera_total: string;
      var_total_pct: string | null;
    }>(
      `WITH
       cortes AS (
         SELECT
           MAX(fecha_corte) AS corte_actual,
           (
             SELECT MAX(fecha_corte)
             FROM cartera.cartera
             WHERE fecha_corte < (SELECT MAX(fecha_corte) FROM cartera.cartera)
           ) AS corte_anterior
         FROM cartera.cartera
       ),
       actual AS (
         SELECT
           ca.calificacion,
           COUNT(*)                                   AS creditos,
           SUM(ca.saldo_capital + ca.saldo_intereses) AS saldo
         FROM cartera.cartera ca
         CROSS JOIN cortes c
         WHERE ca.fecha_corte = c.corte_actual
         GROUP BY ca.calificacion
       ),
       anterior AS (
         SELECT
           ca.calificacion,
           SUM(ca.saldo_capital + ca.saldo_intereses) AS saldo
         FROM cartera.cartera ca
         CROSS JOIN cortes c
         WHERE ca.fecha_corte = c.corte_anterior
         GROUP BY ca.calificacion
       ),
       total AS (
         SELECT SUM(saldo_capital + saldo_intereses) AS cartera_total
         FROM cartera.cartera ca
         CROSS JOIN cortes c
         WHERE ca.fecha_corte = c.corte_actual
       ),
       total_anterior AS (
         SELECT SUM(saldo_capital + saldo_intereses) AS cartera_total
         FROM cartera.cartera ca
         CROSS JOIN cortes c
         WHERE ca.fecha_corte = c.corte_anterior
       )
       SELECT
         a.calificacion,
         CASE a.calificacion
           WHEN 'A' THEN 'A  Al día'
           WHEN 'B' THEN 'B  Vencida 1-30 días'
           WHEN 'C' THEN 'C  Vencida 31-60 días'
           WHEN 'D' THEN 'D  Vencida 61-120 días'
           WHEN 'E' THEN 'E  Vencida > 120 días'
         END                                                        AS descripcion,
         a.creditos::text                                           AS num_creditos,
         ROUND(a.saldo, 2)::text                                    AS saldo,
         ROUND(a.saldo / NULLIF(t.cartera_total, 0) * 100, 1)::text AS participacion_pct,
         ROUND(
           (a.saldo - ant.saldo) / NULLIF(ant.saldo, 0) * 100, 1
         )::text                                                    AS var_vs_anterior_pct,
         ROUND(t.cartera_total, 2)::text                            AS cartera_total,
         ROUND(
           (t.cartera_total - ta.cartera_total)
           / NULLIF(ta.cartera_total, 0) * 100, 1
         )::text                                                    AS var_total_pct
       FROM actual          a
       LEFT JOIN anterior  ant ON ant.calificacion = a.calificacion
       CROSS JOIN total     t
       CROSS JOIN total_anterior ta
       ORDER BY
         CASE a.calificacion
           WHEN 'A' THEN 1
           WHEN 'B' THEN 2
           WHEN 'C' THEN 3
           WHEN 'D' THEN 4
           WHEN 'E' THEN 5
         END`,
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        categoria: r.calificacion,
        descripcion: r.descripcion,
        creditos: num(r.num_creditos),
        monto: num(r.saldo),
        porcentaje: num(r.participacion_pct),
        varVsAnteriorPct: r.var_vs_anterior_pct !== null ? num(r.var_vs_anterior_pct) : null,
        carteraTotal: num(r.cartera_total),
        varTotalPct: r.var_total_pct !== null ? num(r.var_total_pct) : null,
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
    const { rows } = await query<{ fecha: string; recuperacion_m: string }>(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', p.fecha_pago), 'YYYY-MM') AS fecha,
         ROUND(SUM(p.valor_pagado) / 1e6, 3)::text             AS recuperacion_m
       FROM cartera.pagos p
       WHERE p.fecha_pago >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
         AND p.fecha_pago <  DATE_TRUNC('month', CURRENT_DATE)
       GROUP BY DATE_TRUNC('month', p.fecha_pago)
       ORDER BY DATE_TRUNC('month', p.fecha_pago) ASC`,
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        fecha: r.fecha,
        valor: num(r.recuperacion_m) * 1_000_000,
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getCreditosMoraPorTipo = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { rows } = await query<{ tipo_credito: string | null; cantidad: string }>(
      `SELECT cr.tipo_credito, COUNT(*)::text AS cantidad
         FROM cartera.creditos cr
        WHERE cr.estado = 'EN_MORA'
        GROUP BY cr.tipo_credito
        ORDER BY COUNT(*) DESC`,
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        tipo: r.tipo_credito ?? 'OTRO',
        cantidad: num(r.cantidad),
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getEstadoJuridico = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const fechaCorte = await getLatestCorte();
    const { rows } = await query<{
      estado_juridico: string | null;
      cantidad: string;
      saldo_total: string | null;
    }>(
      `SELECT
         COALESCE(c.estado_juridico, 'SIN_PROCESO') AS estado_juridico,
         COUNT(*)::text                              AS cantidad,
         COALESCE(SUM(c.saldo_total), 0)::text       AS saldo_total
       FROM cartera.cartera c
       WHERE c.fecha_corte = $1
       GROUP BY COALESCE(c.estado_juridico, 'SIN_PROCESO')
       ORDER BY COUNT(*) DESC`,
      [fechaCorte],
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        estado: r.estado_juridico ?? 'SIN_PROCESO',
        cantidad: num(r.cantidad),
        saldoTotal: Math.round(num(r.saldo_total)),
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const getAlertasAcademicas = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { rows: [row] } = await query<{
      fecha_corte: string;
      bloqueos_matricula_activos: string;
      diplomas_retenidos: string;
      codeudores_en_riesgo: string;
      mora_critica_180d: string;
      preventivos_vencen_5d: string;
      acuerdos_pago_activos: string;
    }>(
      `WITH ultimo_corte AS (
         SELECT MAX(fecha_corte) AS fecha FROM cartera.cartera
       ),
       bloqueos AS (
         SELECT COUNT(DISTINCT ec.id_credito) AS total
         FROM cartera.edu_creditos   ec
         JOIN cartera.edu_matriculas em ON em.id_matricula = ec.id_matricula
         JOIN cartera.cartera        ca ON ca.id_credito   = ec.id_credito
         CROSS JOIN ultimo_corte     uc
         WHERE ec.aplica_bloqueo_matricula = TRUE
           AND em.bloqueo_matricula        = TRUE
           AND ca.fecha_corte              = uc.fecha
           AND ca.dias_mora                > 0
       ),
       diplomas AS (
         SELECT COUNT(DISTINCT ec.id_credito) AS total
         FROM cartera.edu_creditos   ec
         JOIN cartera.edu_matriculas em ON em.id_matricula = ec.id_matricula
         JOIN cartera.cartera        ca ON ca.id_credito   = ec.id_credito
         CROSS JOIN ultimo_corte     uc
         WHERE ec.aplica_retencion_diploma = TRUE
           AND em.estado_academico         = 'GRADUADO'
           AND ca.fecha_corte              = uc.fecha
           AND ca.dias_mora                > 0
       ),
       codeudores AS (
         SELECT COUNT(DISTINCT cod.id_cliente_codeudor) AS total
         FROM cartera.edu_codeudores cod
         JOIN cartera.cartera        ca  ON ca.id_credito = cod.id_credito
         CROSS JOIN ultimo_corte     uc
         WHERE cod.estado     = 'ACTIVO'
           AND ca.fecha_corte = uc.fecha
           AND ca.dias_mora   > 0
       ),
       mora_critica AS (
         SELECT COUNT(DISTINCT ca.id_credito) AS total
         FROM cartera.cartera  ca
         JOIN cartera.creditos cr ON cr.id_credito = ca.id_credito
         CROSS JOIN ultimo_corte uc
         WHERE ca.fecha_corte = uc.fecha
           AND ca.dias_mora   > 180
           AND cr.estado IN ('VIGENTE','EN_MORA','REESTRUCTURADO','JURIDICO')
       ),
       preventivos AS (
         SELECT COUNT(DISTINCT ca.id_credito) AS total
         FROM cartera.cartera  ca
         JOIN cartera.creditos cr ON cr.id_credito = ca.id_credito
         CROSS JOIN ultimo_corte uc
         WHERE ca.fecha_corte             = uc.fecha
           AND ca.dias_mora               = 0
           AND cr.estado IN ('VIGENTE','EN_MORA','REESTRUCTURADO')
           AND ca.fecha_venc_prox_cuota BETWEEN CURRENT_DATE
                                            AND CURRENT_DATE + INTERVAL '5 days'
       ),
       acuerdos AS (
         SELECT COUNT(*) AS total
         FROM cartera.edu_acuerdos_pago
         WHERE estado_acuerdo = 'ACTIVO'
       )
       SELECT
         (SELECT fecha FROM ultimo_corte)  AS fecha_corte,
         (SELECT total FROM bloqueos)      AS bloqueos_matricula_activos,
         (SELECT total FROM diplomas)      AS diplomas_retenidos,
         (SELECT total FROM codeudores)    AS codeudores_en_riesgo,
         (SELECT total FROM mora_critica)  AS mora_critica_180d,
         (SELECT total FROM preventivos)   AS preventivos_vencen_5d,
         (SELECT total FROM acuerdos)      AS acuerdos_pago_activos`,
    );

    res.json({
      success: true,
      data: {
        bloqueosMatricula:  num(row?.bloqueos_matricula_activos),
        diplomasRetenidos:  num(row?.diplomas_retenidos),
        codeudoresRiesgo:   num(row?.codeudores_en_riesgo),
        moraCriticaActivos: num(row?.mora_critica_180d),
        preventivos5d:      num(row?.preventivos_vencen_5d),
        acuerdosActivos:    num(row?.acuerdos_pago_activos),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getGestionActivaEscenario = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { rows } = await query<{
      escenario: string;
      creditos: string;
      saldo_mora: string;
      dias_mora_promedio: string | null;
    }>(
      `WITH ultimo_corte AS (
         SELECT MAX(fecha_corte) AS fecha_corte
         FROM cartera.cartera
       ),
       base AS (
         SELECT
           cr.estado,
           ca.dias_mora,
           ca.saldo_mora,
           CASE
             WHEN cr.estado IN ('VIGENTE','EN_MORA','REESTRUCTURADO','JURIDICO')
                  AND ca.dias_mora = 0                       THEN 'Preventivo'
             WHEN cr.estado IN ('VIGENTE','EN_MORA','REESTRUCTURADO','JURIDICO')
                  AND ca.dias_mora BETWEEN 1  AND 30         THEN 'Mora temprana - activos'
             WHEN cr.estado IN ('VIGENTE','EN_MORA','REESTRUCTURADO','JURIDICO')
                  AND ca.dias_mora BETWEEN 31 AND 90         THEN 'Mora media - activos'
             WHEN cr.estado IN ('VIGENTE','EN_MORA','REESTRUCTURADO','JURIDICO')
                  AND ca.dias_mora > 90                      THEN 'Mora crítica - activos'
             WHEN cr.estado IN ('CANCELADO','CASTIGADO')
                  AND ca.dias_mora BETWEEN 1  AND 30         THEN 'Mora temprana - graduados'
             WHEN cr.estado IN ('CANCELADO','CASTIGADO')
                  AND ca.dias_mora BETWEEN 31 AND 90         THEN 'Mora media - graduados'
             WHEN cr.estado IN ('CANCELADO','CASTIGADO')
                  AND ca.dias_mora > 90                      THEN 'Mora crítica - graduados'
             ELSE NULL
           END AS escenario
         FROM cartera.cartera  ca
         JOIN cartera.creditos cr ON cr.id_credito = ca.id_credito
         CROSS JOIN ultimo_corte uc
         WHERE ca.fecha_corte = uc.fecha_corte
       )
       SELECT
         escenario,
         COUNT(*)::text                                              AS creditos,
         COALESCE(SUM(saldo_mora), 0)::text                         AS saldo_mora,
         ROUND(AVG(dias_mora) FILTER (WHERE dias_mora > 0), 0)::text AS dias_mora_promedio
       FROM base
       WHERE escenario IS NOT NULL
       GROUP BY escenario
       ORDER BY
         CASE escenario
           WHEN 'Preventivo'               THEN 1
           WHEN 'Mora temprana - activos'  THEN 2
           WHEN 'Mora media - activos'     THEN 3
           WHEN 'Mora crítica - activos'   THEN 4
           WHEN 'Mora temprana - graduados' THEN 5
           WHEN 'Mora media - graduados'   THEN 6
           WHEN 'Mora crítica - graduados' THEN 7
         END`,
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        escenario: r.escenario,
        creditos: num(r.creditos),
        saldoMora: Math.round(num(r.saldo_mora)),
        diasMoraPromedio: num(r.dias_mora_promedio),
      })),
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
