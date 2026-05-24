import { Request, Response, NextFunction } from 'express';

import { query } from '../db';
import { badRequest } from '../utils/httpError';

// =================================================================
// Helpers
// =================================================================

const numOrZero = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtYmd = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  const s = String(v);
  return s ? s.slice(0, 10) : null;
};

const YEAR_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// Lee un parámetro YYYY-MM opcional. Lanza badRequest si vino malformado.
const readYearMonthOpt = (
  v: unknown,
  field: string,
): string | null => {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !YEAR_MONTH_RE.test(v)) {
    throw badRequest(`${field} debe tener formato YYYY-MM`, 'INVALID_YEAR_MONTH');
  }
  return v;
};

// Default: últimos 6 meses contando el actual. Devuelve { desde, hasta } en YYYY-MM.
const defaultLast6Months = (): { desde: string; hasta: string } => {
  const today = new Date();
  const hasta = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const dDesde = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const desde = `${dDesde.getFullYear()}-${String(dDesde.getMonth() + 1).padStart(2, '0')}`;
  return { desde, hasta };
};

const readRangoConDefault = (req: Request): { desde: string; hasta: string } => {
  const desde = readYearMonthOpt(req.query.desde, 'desde');
  const hasta = readYearMonthOpt(req.query.hasta, 'hasta');
  if ((desde && !hasta) || (!desde && hasta)) {
    throw badRequest('desde y hasta deben venir ambos o ninguno', 'INCOMPLETE_RANGE');
  }
  if (desde && hasta) return { desde, hasta };
  return defaultLast6Months();
};

const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// =================================================================
// GET /api/reportes/cortes
// =================================================================

interface CorteRow {
  mes: string;
  fecha_corte: Date | string;
  saldo_capital: string | null;
  saldo_mora: string | null;
  provision_requerida: string | null;
  creditos_activos: string;
  cal_a_creditos: string;
  cal_a_saldo: string | null;
  cal_b_creditos: string;
  cal_b_saldo: string | null;
  cal_c_creditos: string;
  cal_c_saldo: string | null;
  cal_d_creditos: string;
  cal_d_saldo: string | null;
  cal_e_creditos: string;
  cal_e_saldo: string | null;
}

interface CorteMapped {
  mes: string;
  fechaCorte: string | null;
  saldoCapital: number;
  saldoMora: number;
  provisionRequerida: number;
  creditosActivos: number;
  porCalificacion: Record<
    'A' | 'B' | 'C' | 'D' | 'E',
    { creditos: number; saldo: number }
  >;
}

const mapCorteRow = (row: CorteRow): CorteMapped => ({
  mes: row.mes,
  fechaCorte: fmtYmd(row.fecha_corte),
  saldoCapital: Math.round(numOrZero(row.saldo_capital)),
  saldoMora: Math.round(numOrZero(row.saldo_mora)),
  provisionRequerida: Math.round(numOrZero(row.provision_requerida)),
  creditosActivos: numOrZero(row.creditos_activos),
  porCalificacion: {
    A: {
      creditos: numOrZero(row.cal_a_creditos),
      saldo: Math.round(numOrZero(row.cal_a_saldo)),
    },
    B: {
      creditos: numOrZero(row.cal_b_creditos),
      saldo: Math.round(numOrZero(row.cal_b_saldo)),
    },
    C: {
      creditos: numOrZero(row.cal_c_creditos),
      saldo: Math.round(numOrZero(row.cal_c_saldo)),
    },
    D: {
      creditos: numOrZero(row.cal_d_creditos),
      saldo: Math.round(numOrZero(row.cal_d_saldo)),
    },
    E: {
      creditos: numOrZero(row.cal_e_creditos),
      saldo: Math.round(numOrZero(row.cal_e_saldo)),
    },
  },
});

const CORTES_SELECT = `
  SELECT
    TO_CHAR(fecha_corte, 'YYYY-MM')                          AS mes,
    fecha_corte,
    SUM(saldo_capital)                                       AS saldo_capital,
    SUM(saldo_mora)                                          AS saldo_mora,
    SUM(provision_requerida)                                 AS provision_requerida,
    COUNT(*)                                                 AS creditos_activos,
    COUNT(*) FILTER (WHERE calificacion = 'A')               AS cal_a_creditos,
    SUM(saldo_total) FILTER (WHERE calificacion = 'A')       AS cal_a_saldo,
    COUNT(*) FILTER (WHERE calificacion = 'B')               AS cal_b_creditos,
    SUM(saldo_total) FILTER (WHERE calificacion = 'B')       AS cal_b_saldo,
    COUNT(*) FILTER (WHERE calificacion = 'C')               AS cal_c_creditos,
    SUM(saldo_total) FILTER (WHERE calificacion = 'C')       AS cal_c_saldo,
    COUNT(*) FILTER (WHERE calificacion = 'D')               AS cal_d_creditos,
    SUM(saldo_total) FILTER (WHERE calificacion = 'D')       AS cal_d_saldo,
    COUNT(*) FILTER (WHERE calificacion = 'E')               AS cal_e_creditos,
    SUM(saldo_total) FILTER (WHERE calificacion = 'E')       AS cal_e_saldo
  FROM cartera.cartera
`;

// Si no llegan params explícitos, usamos los últimos 6 cortes disponibles
// (no los últimos 6 meses de calendario), porque los snapshots se generan
// mes a mes y puede haber huecos.
const fetchCortes = async (
  req: Request,
): Promise<CorteMapped[]> => {
  const desdeRaw = readYearMonthOpt(req.query.desde, 'desde');
  const hastaRaw = readYearMonthOpt(req.query.hasta, 'hasta');
  if ((desdeRaw && !hastaRaw) || (!desdeRaw && hastaRaw)) {
    throw badRequest('desde y hasta deben venir ambos o ninguno', 'INCOMPLETE_RANGE');
  }

  let sql: string;
  let params: unknown[];

  if (desdeRaw && hastaRaw) {
    sql = `
      ${CORTES_SELECT}
      WHERE fecha_corte BETWEEN ($1 || '-01')::date
        AND (($2 || '-01')::date + INTERVAL '1 month - 1 day')
      GROUP BY fecha_corte
      ORDER BY fecha_corte ASC
    `;
    params = [desdeRaw, hastaRaw];
  } else {
    sql = `
      WITH ultimos AS (
        SELECT DISTINCT fecha_corte
          FROM cartera.cartera
         ORDER BY fecha_corte DESC
         LIMIT 6
      )
      ${CORTES_SELECT}
      WHERE fecha_corte IN (SELECT fecha_corte FROM ultimos)
      GROUP BY fecha_corte
      ORDER BY fecha_corte ASC
    `;
    params = [];
  }

  const { rows } = await query<CorteRow>(sql, params);
  return rows.map(mapCorteRow);
};

export const getCortes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await fetchCortes(req);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// GET /api/reportes/pagos
// =================================================================

interface PagoRow {
  mes: string;
  cantidad_pagos: string;
  monto_recaudado: string | null;
  medio_pago_top: string | null;
}

export const getPagos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { desde, hasta } = readRangoConDefault(req);
    const { rows } = await query<PagoRow>(
      `
      SELECT
        TO_CHAR(DATE_TRUNC('month', fecha_pago), 'YYYY-MM') AS mes,
        COUNT(*)                                            AS cantidad_pagos,
        SUM(valor_pagado)                                   AS monto_recaudado,
        MODE() WITHIN GROUP (ORDER BY medio_pago)           AS medio_pago_top
      FROM cartera.pagos
      WHERE fecha_pago BETWEEN ($1 || '-01')::date
        AND (($2 || '-01')::date + INTERVAL '1 month - 1 day')
      GROUP BY DATE_TRUNC('month', fecha_pago)
      ORDER BY mes ASC
      `,
      [desde, hasta],
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        mes: r.mes,
        cantidadPagos: numOrZero(r.cantidad_pagos),
        montoRecaudado: Math.round(numOrZero(r.monto_recaudado)),
        medioPagoTop: r.medio_pago_top ?? null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// GET /api/reportes/gestiones
// =================================================================

interface GestionReporteRow {
  mes: string;
  enviado: string;
  promesa_pago: string;
  no_contesta: string;
  rechazado: string;
  exitoso: string;
}

export const getGestionesReporte = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { desde, hasta } = readRangoConDefault(req);
    const { rows } = await query<GestionReporteRow>(
      `
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS mes,
        COUNT(*) FILTER (WHERE resultado = 'enviado')         AS enviado,
        COUNT(*) FILTER (WHERE resultado = 'promesa_pago')    AS promesa_pago,
        COUNT(*) FILTER (WHERE resultado = 'no_contesta')     AS no_contesta,
        COUNT(*) FILTER (WHERE resultado = 'rechazado')       AS rechazado,
        COUNT(*) FILTER (WHERE resultado IN ('promesa_pago', 'enviado')) AS exitoso
      FROM cartera.mcp_gestiones
      WHERE created_at >= ($1 || '-01')::date
        AND created_at < (($2 || '-01')::date + INTERVAL '1 month')
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY mes ASC
      `,
      [desde, hasta],
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        mes: r.mes,
        resultados: {
          enviado: numOrZero(r.enviado),
          promesa_pago: numOrZero(r.promesa_pago),
          no_contesta: numOrZero(r.no_contesta),
          rechazado: numOrZero(r.rechazado),
          exitoso: numOrZero(r.exitoso),
        },
      })),
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// GET /api/reportes/estrategias-activas
// =================================================================

interface EstrategiaRow {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  segmento_config: string | null;
  created_at: Date | string;
  gestiones_ejecutadas: string;
  creditos_target: string;
}

const safeParseJson = (raw: string | null): unknown => {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const getEstrategiasActivas = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { rows } = await query<EstrategiaRow>(`
      SELECT
        e.id, e.nombre, e.descripcion, e.estado, e.created_at,
        e.segmento_config,
        COUNT(DISTINCT a.id) AS gestiones_ejecutadas,
        (
          SELECT COUNT(*)
            FROM cartera.cartera c
           WHERE c.fecha_corte = (SELECT MAX(fecha_corte) FROM cartera.cartera)
             AND c.calificacion = ANY(
               ARRAY(
                 SELECT jsonb_array_elements_text(
                   CASE
                     WHEN jsonb_typeof(
                            COALESCE(e.segmento_config, '{}')::jsonb -> 'calificaciones'
                          ) = 'array'
                     THEN COALESCE(e.segmento_config, '{}')::jsonb -> 'calificaciones'
                     ELSE '[]'::jsonb
                   END
                 )
               )
             )
        ) AS creditos_target
      FROM cartera.mcp_estrategias e
      LEFT JOIN cartera.mcp_automatizaciones a ON a.estrategia_id = e.id
      WHERE e.estado IN ('ACTIVA', 'PAUSADA')
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion,
        estado: r.estado,
        segmentoConfig: safeParseJson(r.segmento_config),
        creditosTarget: numOrZero(r.creditos_target),
        gestionesEjecutadas: numOrZero(r.gestiones_ejecutadas),
        createdAt: fmtYmd(r.created_at) ?? '',
      })),
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// GET /api/reportes/juridico
// =================================================================

interface JuridicoRow {
  mes: string;
  sin_proceso_creditos: string;
  sin_proceso_saldo: string | null;
  prejuridico_creditos: string;
  prejuridico_saldo: string | null;
  juridico_creditos: string;
  juridico_saldo: string | null;
  acuerdo_creditos: string;
  acuerdo_saldo: string | null;
  sentencia_creditos: string;
  sentencia_saldo: string | null;
  embargo_creditos: string;
  embargo_saldo: string | null;
}

export const getJuridico = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { desde, hasta } = readRangoConDefault(req);
    const { rows } = await query<JuridicoRow>(
      `
      SELECT
        TO_CHAR(fecha_corte, 'YYYY-MM')                          AS mes,
        COUNT(*) FILTER (WHERE estado_juridico = 'SIN_PROCESO')  AS sin_proceso_creditos,
        SUM(saldo_total) FILTER (WHERE estado_juridico = 'SIN_PROCESO') AS sin_proceso_saldo,
        COUNT(*) FILTER (WHERE estado_juridico = 'PREJURIDICO')  AS prejuridico_creditos,
        SUM(saldo_total) FILTER (WHERE estado_juridico = 'PREJURIDICO') AS prejuridico_saldo,
        COUNT(*) FILTER (WHERE estado_juridico = 'JURIDICO')     AS juridico_creditos,
        SUM(saldo_total) FILTER (WHERE estado_juridico = 'JURIDICO') AS juridico_saldo,
        COUNT(*) FILTER (WHERE estado_juridico = 'ACUERDO_PAGO') AS acuerdo_creditos,
        SUM(saldo_total) FILTER (WHERE estado_juridico = 'ACUERDO_PAGO') AS acuerdo_saldo,
        COUNT(*) FILTER (WHERE estado_juridico = 'SENTENCIA')    AS sentencia_creditos,
        SUM(saldo_total) FILTER (WHERE estado_juridico = 'SENTENCIA') AS sentencia_saldo,
        COUNT(*) FILTER (WHERE estado_juridico = 'EMBARGO')      AS embargo_creditos,
        SUM(saldo_total) FILTER (WHERE estado_juridico = 'EMBARGO') AS embargo_saldo
      FROM cartera.cartera
      WHERE fecha_corte BETWEEN ($1 || '-01')::date
        AND (($2 || '-01')::date + INTERVAL '1 month - 1 day')
      GROUP BY fecha_corte
      ORDER BY fecha_corte ASC
      `,
      [desde, hasta],
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        mes: r.mes,
        porEstado: {
          SIN_PROCESO: {
            creditos: numOrZero(r.sin_proceso_creditos),
            saldoTotal: Math.round(numOrZero(r.sin_proceso_saldo)),
          },
          PREJURIDICO: {
            creditos: numOrZero(r.prejuridico_creditos),
            saldoTotal: Math.round(numOrZero(r.prejuridico_saldo)),
          },
          JURIDICO: {
            creditos: numOrZero(r.juridico_creditos),
            saldoTotal: Math.round(numOrZero(r.juridico_saldo)),
          },
          ACUERDO_PAGO: {
            creditos: numOrZero(r.acuerdo_creditos),
            saldoTotal: Math.round(numOrZero(r.acuerdo_saldo)),
          },
          SENTENCIA: {
            creditos: numOrZero(r.sentencia_creditos),
            saldoTotal: Math.round(numOrZero(r.sentencia_saldo)),
          },
          EMBARGO: {
            creditos: numOrZero(r.embargo_creditos),
            saldoTotal: Math.round(numOrZero(r.embargo_saldo)),
          },
        },
      })),
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// GET /api/reportes/exportar (CSV)
// =================================================================

export const exportarReporte = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await fetchCortes(req);

    const desde =
      typeof req.query.desde === 'string' && YEAR_MONTH_RE.test(req.query.desde)
        ? req.query.desde
        : 'inicio';
    const hasta =
      typeof req.query.hasta === 'string' && YEAR_MONTH_RE.test(req.query.hasta)
        ? req.query.hasta
        : 'reciente';
    const filename = `reporte-cartera-${desde}-${hasta}.csv`;

    const headers = [
      'Mes',
      'Saldo Capital',
      'Saldo Mora',
      'Provisión Requerida',
      'Créditos Activos',
      'Cal A',
      'Saldo A',
      'Cal B',
      'Saldo B',
      'Cal C',
      'Saldo C',
      'Cal D',
      'Saldo D',
      'Cal E',
      'Saldo E',
    ];

    const lines = [
      headers.join(','),
      ...data.map((r) =>
        [
          csvEscape(r.mes),
          r.saldoCapital,
          r.saldoMora,
          r.provisionRequerida,
          r.creditosActivos,
          r.porCalificacion.A.creditos,
          r.porCalificacion.A.saldo,
          r.porCalificacion.B.creditos,
          r.porCalificacion.B.saldo,
          r.porCalificacion.C.creditos,
          r.porCalificacion.C.saldo,
          r.porCalificacion.D.creditos,
          r.porCalificacion.D.saldo,
          r.porCalificacion.E.creditos,
          r.porCalificacion.E.saldo,
        ].join(','),
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // BOM (U+FEFF) para que Excel reconozca UTF-8 con tildes.
    res.send(`﻿${lines.join('\n')}`);
  } catch (err) {
    next(err);
  }
};
