import { Request, Response, NextFunction } from 'express';

import { query } from '../db';
import { badRequest, notFound } from '../utils/httpError';
import { assertUuid, parsePagination } from '../utils/validate';

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

const toDate = (v: unknown): Date | null => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseNumericId = (raw: string | undefined): number => {
  if (typeof raw !== 'string') throw badRequest('id inválido');
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('id debe ser un entero positivo');
  return id;
};

const CANALES_VALIDOS = ['whatsapp', 'llamada', 'email', 'sms'] as const;
const RESULTADOS_VALIDOS = ['enviado', 'promesa_pago', 'no_contesta', 'rechazado'] as const;

type Canal = (typeof CANALES_VALIDOS)[number];
type Resultado = (typeof RESULTADOS_VALIDOS)[number];

interface GestionListRow {
  id: number;
  id_credito: string;
  canal: string;
  resultado: string;
  valor_promesa: string | null;
  fecha_promesa: Date | string | null;
  notas: string | null;
  created_at: Date | string;
  nombre: string;
  numero_credito: string;
  tipo_credito: string;
  calificacion: string | null;
  dias_mora: string | number | null;
  estado_juridico: string | null;
  ingresos_mensuales: string | null;
  // Extras opcionales (juridica)
  abogado_id?: string | null;
  saldo_total?: string | null;
  // total_count solo en listados paginados
  total_count?: string | null;
}

const mapGestionRow = (row: GestionListRow) => {
  const fechaPromesa = toDate(row.fecha_promesa);
  const today = new Date();
  const base: Record<string, unknown> = {
    id: row.id,
    idCredito: row.id_credito,
    nombre: (row.nombre ?? '').trim() || 'Sin nombre',
    numeroCredito: row.numero_credito,
    tipoCredito: row.tipo_credito,
    canal: row.canal,
    resultado: row.resultado,
    valorPrometido:
      row.valor_promesa !== null && row.valor_promesa !== undefined
        ? Math.round(numOrZero(row.valor_promesa))
        : null,
    fechaPromesa: fmtYmd(fechaPromesa),
    calificacion: row.calificacion ?? 'A',
    diasMora: numOrZero(row.dias_mora),
    estadoJuridico: row.estado_juridico ?? 'SIN_PROCESO',
    origen: 'Manual',
    estrategiaAsociada: null,
    cumplida:
      row.resultado === 'promesa_pago' && fechaPromesa !== null && fechaPromesa < today,
    ingresosMensuales: Math.round(numOrZero(row.ingresos_mensuales)),
    notas: row.notas ?? '',
    fecha: fmtYmd(row.created_at) ?? '',
  };
  // Campos extra solo se incluyen cuando la query los trae (juridica).
  if (row.abogado_id !== undefined) {
    base.abogadoAsignado = row.abogado_id ?? null;
  }
  if (row.saldo_total !== undefined) {
    base.saldoTotal = Math.round(numOrZero(row.saldo_total));
  }
  return base;
};

// SELECT estándar para listados de gestiones. Acepta columnas extra opcionales.
const buildSelect = (extraCols: string = ''): string => `
  SELECT
    g.id,
    g.id_credito,
    g.canal,
    g.resultado,
    g.valor_promesa,
    g.fecha_promesa,
    g.notas,
    g.created_at,
    TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS nombre,
    cr.numero_credito,
    cr.tipo_credito,
    c.calificacion,
    c.dias_mora,
    c.estado_juridico,
    cl.ingresos_mensuales${extraCols ? ',\n    ' + extraCols : ''}
`;

const BASE_JOINS = `
  FROM cartera.mcp_gestiones g
  JOIN cartera.creditos cr ON cr.id_credito = g.id_credito
  JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
  LEFT JOIN cartera.cartera c ON c.id_credito = cr.id_credito
    AND c.fecha_corte = (SELECT MAX(fecha_corte) FROM cartera.cartera)
`;

// =================================================================
// GET /api/gestiones/resumen
// =================================================================

interface ResumenRow {
  total_gestiones: string;
  promesas_activas: string;
  monto_comprometido: string;
  tasa_contacto: string;
  promesas_proximas_semana: string;
}

export const getResumen = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query<ResumenRow>(`
      SELECT
        COUNT(*)                                                        AS total_gestiones,
        COUNT(*) FILTER (WHERE resultado = 'promesa_pago'
          AND fecha_promesa >= CURRENT_DATE)                            AS promesas_activas,
        COALESCE(SUM(valor_promesa) FILTER (
          WHERE resultado = 'promesa_pago'
            AND fecha_promesa >= CURRENT_DATE), 0)                      AS monto_comprometido,
        ROUND(COUNT(*) FILTER (WHERE resultado <> 'no_contesta')
          * 100.0 / NULLIF(COUNT(*), 0), 1)                             AS tasa_contacto,
        COUNT(*) FILTER (WHERE resultado = 'promesa_pago'
          AND fecha_promesa BETWEEN CURRENT_DATE
          AND CURRENT_DATE + INTERVAL '7 days')                         AS promesas_proximas_semana
      FROM cartera.mcp_gestiones
    `);
    const row = rows[0];
    res.json({
      success: true,
      data: {
        totalGestiones: numOrZero(row?.total_gestiones),
        promesasActivas: numOrZero(row?.promesas_activas),
        montoComprometido: Math.round(numOrZero(row?.monto_comprometido)),
        tasaContacto: numOrZero(row?.tasa_contacto),
        promesasProximasSemana: numOrZero(row?.promesas_proximas_semana),
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// GET /api/gestiones
// =================================================================

const SORT_COLS: Record<string, string> = {
  fecha: 'g.created_at',
  canal: 'g.canal',
  resultado: 'g.resultado',
  diasMora: 'c.dias_mora',
  valor: 'g.valor_promesa',
};

const RANGOS_FECHA: Record<string, string> = {
  hoy: `g.created_at::date = CURRENT_DATE`,
  semana: `g.created_at >= CURRENT_DATE - INTERVAL '7 days'`,
  mes: `g.created_at >= CURRENT_DATE - INTERVAL '30 days'`,
};

export const listGestiones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : null;
    const canal = typeof req.query.canal === 'string' ? req.query.canal : null;
    const resultado = typeof req.query.resultado === 'string' ? req.query.resultado : null;
    const calificacion =
      typeof req.query.calificacion === 'string' ? req.query.calificacion : null;
    const estadoJuridico =
      typeof req.query.estadoJuridico === 'string' ? req.query.estadoJuridico : null;
    const rangoFecha =
      typeof req.query.rangoFecha === 'string' ? req.query.rangoFecha : null;

    const sortByRaw = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'fecha';
    const sortDirRaw =
      typeof req.query.sortDir === 'string' ? req.query.sortDir.toLowerCase() : 'desc';
    const orderCol = SORT_COLS[sortByRaw] ?? 'g.created_at';
    const orderDir = sortDirRaw === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const i = params.length;
      conditions.push(
        `((cl.primer_nombre || ' ' || cl.primer_apellido) ILIKE $${i} OR cr.numero_credito ILIKE $${i})`,
      );
    }
    if (canal) {
      params.push(canal);
      conditions.push(`g.canal = $${params.length}`);
    }
    if (resultado) {
      params.push(resultado);
      conditions.push(`g.resultado = $${params.length}`);
    }
    if (calificacion) {
      params.push(calificacion);
      conditions.push(`c.calificacion = $${params.length}`);
    }
    if (estadoJuridico) {
      params.push(estadoJuridico);
      conditions.push(`c.estado_juridico = $${params.length}`);
    }
    if (rangoFecha && RANGOS_FECHA[rangoFecha]) {
      conditions.push(RANGOS_FECHA[rangoFecha]);
    }

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const sql = `
      ${buildSelect('COUNT(*) OVER() AS total_count')}
      ${BASE_JOINS}
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY ${orderCol} ${orderDir} NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    params.push(limit);
    params.push(offset);

    const { rows } = await query<GestionListRow>(sql, params);
    const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
    const data = rows.map(mapGestionRow);

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

// =================================================================
// GET /api/gestiones/promesas?estado=proximas|vencidas|cumplidas
// =================================================================

const PROMESAS_FILTERS: Record<string, string> = {
  proximas: `g.resultado = 'promesa_pago' AND g.fecha_promesa >= CURRENT_DATE`,
  vencidas: `g.resultado = 'promesa_pago' AND g.fecha_promesa < CURRENT_DATE`,
  cumplidas: `g.resultado = 'promesa_pago' AND EXISTS (
    SELECT 1 FROM cartera.pagos p
    WHERE p.id_credito = g.id_credito
      AND p.fecha_pago >= g.created_at::date
  )`,
};

export const listPromesas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const estado = typeof req.query.estado === 'string' ? req.query.estado : null;
    if (!estado || !PROMESAS_FILTERS[estado]) {
      throw badRequest(
        'estado debe ser "proximas", "vencidas" o "cumplidas"',
        'INVALID_ESTADO',
      );
    }

    const sql = `
      ${buildSelect()}
      ${BASE_JOINS}
      WHERE ${PROMESAS_FILTERS[estado]}
      ORDER BY g.fecha_promesa ASC NULLS LAST
    `;
    const { rows } = await query<GestionListRow>(sql);
    res.json({ success: true, data: rows.map(mapGestionRow) });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// GET /api/gestiones/juridica
// =================================================================

export const listJuridica = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      ${buildSelect('c.saldo_total, c.abogado_id')}
      ${BASE_JOINS}
      WHERE c.estado_juridico IS NOT NULL
        AND c.estado_juridico <> 'SIN_PROCESO'
      ORDER BY c.dias_mora DESC NULLS LAST
    `;
    const { rows } = await query<GestionListRow>(sql);
    res.json({ success: true, data: rows.map(mapGestionRow) });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// GET /api/gestiones/:id
// =================================================================

interface HistorialRow {
  id: number;
  canal: string;
  resultado: string;
  valor_promesa: string | null;
  fecha_promesa: Date | string | null;
  notas: string | null;
  created_at: Date | string;
}

const fetchGestionById = async (id: number) => {
  const { rows } = await query<GestionListRow>(
    `
    ${buildSelect()}
    ${BASE_JOINS}
    WHERE g.id = $1
    `,
    [id],
  );
  return rows[0] ?? null;
};

export const getGestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseNumericId(req.params.id);
    const row = await fetchGestionById(id);
    if (!row) throw notFound('Gestión no encontrada');

    const { rows: historial } = await query<HistorialRow>(
      `SELECT id, canal, resultado, valor_promesa, fecha_promesa, notas, created_at
         FROM cartera.mcp_gestiones
        WHERE id_credito = $2 AND id <> $1
        ORDER BY created_at DESC
        LIMIT 10`,
      [id, row.id_credito],
    );

    const base = mapGestionRow(row);
    const data = {
      ...base,
      historial: historial.map((h) => ({
        id: h.id,
        canal: h.canal,
        resultado: h.resultado,
        valorPrometido:
          h.valor_promesa !== null && h.valor_promesa !== undefined
            ? Math.round(numOrZero(h.valor_promesa))
            : null,
        fechaPromesa: fmtYmd(h.fecha_promesa),
        notas: h.notas ?? '',
        fecha: fmtYmd(h.created_at) ?? '',
      })),
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// POST /api/gestiones
// =================================================================

export const createGestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body ?? {};
    const idCredito = assertUuid(body.id_credito, 'id_credito');

    const canal = body.canal;
    if (typeof canal !== 'string' || !(CANALES_VALIDOS as readonly string[]).includes(canal)) {
      throw badRequest(`canal debe ser uno de: ${CANALES_VALIDOS.join(', ')}`, 'INVALID_CANAL');
    }

    const resultado = body.resultado;
    if (
      typeof resultado !== 'string' ||
      !(RESULTADOS_VALIDOS as readonly string[]).includes(resultado)
    ) {
      throw badRequest(
        `resultado debe ser uno de: ${RESULTADOS_VALIDOS.join(', ')}`,
        'INVALID_RESULTADO',
      );
    }

    let valorPromesa: number | null = null;
    let fechaPromesa: string | null = null;

    if (resultado === 'promesa_pago') {
      valorPromesa = Number(body.valor_promesa);
      if (!Number.isFinite(valorPromesa) || valorPromesa <= 0) {
        throw badRequest(
          'valor_promesa debe ser mayor a 0 cuando resultado es "promesa_pago"',
        );
      }
      if (
        typeof body.fecha_promesa !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(body.fecha_promesa)
      ) {
        throw badRequest(
          'fecha_promesa es requerida (YYYY-MM-DD) cuando resultado es "promesa_pago"',
        );
      }
      if (Number.isNaN(new Date(body.fecha_promesa).getTime())) {
        throw badRequest('fecha_promesa inválida');
      }
      fechaPromesa = body.fecha_promesa;
    } else {
      // Para otros resultados, valor_promesa/fecha_promesa son opcionales.
      if (body.valor_promesa !== undefined && body.valor_promesa !== null) {
        const v = Number(body.valor_promesa);
        if (Number.isFinite(v) && v > 0) valorPromesa = v;
      }
      if (typeof body.fecha_promesa === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha_promesa)) {
        fechaPromesa = body.fecha_promesa;
      }
    }

    const notas = typeof body.notas === 'string' ? body.notas : null;

    // mcp_gestiones.id_credito no tiene FK formal — validar manualmente.
    const { rows: credito } = await query<{ id_credito: string }>(
      `SELECT id_credito FROM cartera.creditos WHERE id_credito = $1`,
      [idCredito],
    );
    if (credito.length === 0) {
      throw badRequest('id_credito no existe en cartera.creditos', 'INVALID_FK');
    }

    const { rows: inserted } = await query<{ id: number }>(
      `INSERT INTO cartera.mcp_gestiones
         (id_credito, canal, resultado, valor_promesa, fecha_promesa, notas, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [idCredito, canal as Canal, resultado as Resultado, valorPromesa, fechaPromesa, notas],
    );

    const row = await fetchGestionById(inserted[0].id);
    if (!row) throw notFound('No se pudo recuperar la gestión recién creada');

    res.status(201).json({ success: true, data: mapGestionRow(row) });
  } catch (err) {
    next(err);
  }
};
