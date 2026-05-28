import { Request, Response, NextFunction } from 'express';

import { query, pool } from '../db';
import { badRequest, notFound } from '../utils/httpError';
import { assertUuid, parsePagination } from '../utils/validate';

// =================================================================
// Helpers compartidos
// =================================================================

const formatAcuerdoId = (id: number): string => `A-${String(id).padStart(4, '0')}`;

const parseAcuerdoId = (raw: string | undefined): number => {
  if (typeof raw !== 'string') throw badRequest('id inválido');
  const m = /^A-(\d{1,10})$/i.exec(raw);
  if (!m) throw badRequest('id debe tener formato A-XXXX');
  const id = Number(m[1]);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('id inválido');
  return id;
};

const formatClienteId = (uuid: string): string =>
  `C-${uuid.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

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

const fmtIso = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString();
  }
  return String(v);
};

const toDate = (v: unknown): Date | null => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

const startOfDay = (d: Date): Date => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
};

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

// Enums DB → strings legibles del frontend. El enum `estado_acuerdo_enum`
// solo tiene 3 valores: ACTIVO, CUMPLIDO, INCUMPLIDO.
const ESTADO_DB_TO_UI: Record<string, 'Vigente' | 'Cumplido' | 'Incumplido'> = {
  ACTIVO: 'Vigente',
  CUMPLIDO: 'Cumplido',
  INCUMPLIDO: 'Incumplido',
};

const getEstadoUi = (dbEstado: string | null): 'Vigente' | 'Cumplido' | 'Incumplido' =>
  (dbEstado && ESTADO_DB_TO_UI[dbEstado]) || 'Vigente';

const ESTADO_UI_TO_DB: Record<string, string> = {
  Vigente: 'ACTIVO',
  Cumplido: 'CUMPLIDO',
  Incumplido: 'INCUMPLIDO',
};

const ESTADOS_DB_VALIDOS = ['ACTIVO', 'CUMPLIDO', 'INCUMPLIDO'] as const;

const computeCumplimiento = (montoAcordado: number, totalPagado: number): number => {
  if (montoAcordado <= 0) return 0;
  return Math.min(100, Math.round((totalPagado * 100) / montoAcordado));
};

// =================================================================
// GET /api/acuerdos/resumen
// =================================================================

interface ResumenRow {
  vigentes: string;
  cumplidos_mes: string;
  incumplidos: string;
  monto_comprometido: string;
}

export const getResumen = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query<ResumenRow>(`
      SELECT
        COUNT(*) FILTER (WHERE estado_acuerdo = 'ACTIVO')                       AS vigentes,
        COUNT(*) FILTER (WHERE estado_acuerdo = 'CUMPLIDO'
          AND updated_at >= DATE_TRUNC('month', CURRENT_DATE))                  AS cumplidos_mes,
        COUNT(*) FILTER (WHERE estado_acuerdo = 'INCUMPLIDO')                   AS incumplidos,
        COALESCE(SUM(valor_cuota_acuerdo * num_cuotas_acuerdo)
          FILTER (WHERE estado_acuerdo = 'ACTIVO'), 0)                          AS monto_comprometido
      FROM cartera.edu_acuerdos_pago
    `);
    const row = rows[0];
    res.json({
      success: true,
      data: {
        vigentes: numOrZero(row?.vigentes),
        cumplidosMes: numOrZero(row?.cumplidos_mes),
        incumplidos: numOrZero(row?.incumplidos),
        montoComprometido: Math.round(numOrZero(row?.monto_comprometido)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// GET /api/acuerdos — listado paginado
// =================================================================

const SORT_COLS: Record<string, string> = {
  cliente: "cl.primer_nombre || ' ' || cl.primer_apellido",
  monto: 'a.valor_cuota_acuerdo * a.num_cuotas_acuerdo',
  cuotas: 'a.num_cuotas_acuerdo',
  proximoPago: 'a.fecha_limite',
  cumplimiento: 'total_pagado',
  estado: 'a.estado_acuerdo',
};

const RANGOS_FECHA: Record<string, string> = {
  semana: `a.fecha_limite BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`,
  mes: `a.fecha_limite BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`,
  vencido: `a.fecha_limite < CURRENT_DATE`,
};

interface AcuerdoListRow {
  id_acuerdo: number;
  id_credito: string;
  tipo_acuerdo: string | null;
  descuento_pct_mora: string | null;
  num_cuotas_acuerdo: string | number;
  valor_cuota_acuerdo: string | null;
  estado_acuerdo: string;
  fecha_inicio: Date | string | null;
  fecha_limite: Date | string | null;
  creado_por: string | null;
  notas: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  id_cliente: string;
  cliente_nombre: string;
  numero_credito: string;
  cuotas_pagadas: string;
  total_pagado: string;
  total_count?: string;
}

const mapAcuerdoListRow = (row: AcuerdoListRow) => {
  const valorCuota = numOrZero(row.valor_cuota_acuerdo);
  const cuotasTotales = numOrZero(row.num_cuotas_acuerdo);
  const cuotasPagadas = numOrZero(row.cuotas_pagadas);
  const montoAcordado = Math.round(valorCuota * cuotasTotales);
  const totalPagado = Math.round(numOrZero(row.total_pagado));
  const cumplimiento = computeCumplimiento(montoAcordado, totalPagado);
  const estado = getEstadoUi(row.estado_acuerdo);
  const sinProximoPago = estado !== 'Vigente';

  return {
    id: formatAcuerdoId(row.id_acuerdo),
    clienteId: formatClienteId(row.id_cliente),
    clienteNombre: (row.cliente_nombre ?? '').trim() || 'Sin nombre',
    numeroCredito: row.numero_credito,
    tipoAcuerdo: row.tipo_acuerdo,
    montoAcordado,
    cuotasPagadas,
    cuotasTotales,
    valorCuota: Math.round(valorCuota),
    descuentoPctMora: numOrZero(row.descuento_pct_mora),
    proximoPago: sinProximoPago
      ? null
      : {
          fecha: fmtYmd(row.fecha_limite),
          monto: Math.round(valorCuota),
        },
    cumplimiento,
    estado,
    creadoPor: row.creado_por,
    notas: row.notas ?? '',
    fechaInicio: fmtYmd(row.fecha_inicio),
    fechaLimite: fmtYmd(row.fecha_limite),
    createdAt: fmtIso(row.created_at),
    updatedAt: fmtIso(row.updated_at),
  };
};

export const listAcuerdos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : null;
    const estadoUi =
      typeof req.query.estado === 'string' ? req.query.estado.trim() : null;
    const rangoFecha =
      typeof req.query.rangoFecha === 'string' ? req.query.rangoFecha.trim() : null;

    const sortByRaw =
      typeof req.query.sortBy === 'string' ? req.query.sortBy : 'proximoPago';
    const sortDirRaw =
      typeof req.query.sortDir === 'string' ? req.query.sortDir.toLowerCase() : 'desc';
    const orderCol = SORT_COLS[sortByRaw] ?? SORT_COLS.proximoPago;
    const orderDir = sortDirRaw === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const i = params.length;
      conditions.push(
        `(
          (cl.primer_nombre || ' ' || cl.primer_apellido) ILIKE $${i}
          OR cr.numero_credito ILIKE $${i}
          OR a.id_acuerdo::text ILIKE $${i}
        )`,
      );
    }

    if (estadoUi) {
      // El frontend manda los estados en versión "Vigente/Cumplido/…" y la DB
      // tiene los enums en mayúscula. Aceptamos ambos formatos.
      const dbEstado =
        ESTADO_UI_TO_DB[estadoUi] ??
        (estadoUi.toUpperCase() as string);
      if ((ESTADOS_DB_VALIDOS as readonly string[]).includes(dbEstado)) {
        params.push(dbEstado);
        conditions.push(`a.estado_acuerdo = $${params.length}`);
      }
    }

    if (rangoFecha && RANGOS_FECHA[rangoFecha]) {
      conditions.push(RANGOS_FECHA[rangoFecha]);
    }

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const sql = `
      SELECT
        a.id_acuerdo,
        a.id_credito,
        a.tipo_acuerdo,
        a.descuento_pct_mora,
        a.num_cuotas_acuerdo,
        a.valor_cuota_acuerdo,
        a.estado_acuerdo,
        a.fecha_inicio,
        a.fecha_limite,
        a.creado_por,
        a.notas,
        a.created_at,
        a.updated_at,
        cl.id_cliente,
        TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS cliente_nombre,
        cr.numero_credito,
        (
          SELECT COUNT(*)
            FROM cartera.pagos p
           WHERE p.id_credito = a.id_credito
             AND p.fecha_pago >= a.fecha_inicio
        )                                               AS cuotas_pagadas,
        COALESCE((
          SELECT SUM(p.valor_pagado)
            FROM cartera.pagos p
           WHERE p.id_credito = a.id_credito
             AND p.fecha_pago >= a.fecha_inicio
        ), 0)                                           AS total_pagado,
        COUNT(*) OVER()                                 AS total_count
      FROM cartera.edu_acuerdos_pago a
      JOIN cartera.creditos cr ON cr.id_credito = a.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY ${orderCol} ${orderDir} NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    params.push(limit);
    params.push(offset);

    const { rows } = await query<AcuerdoListRow>(sql, params);
    const total = rows[0]?.total_count ? Number(rows[0].total_count) : 0;
    const data = rows.map(mapAcuerdoListRow);

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
// GET /api/acuerdos/:id (helper reusado por POSTs)
// =================================================================

interface AcuerdoDetalleRow {
  id_acuerdo: number;
  id_credito: string;
  tipo_acuerdo: string | null;
  descuento_pct_mora: string | null;
  num_cuotas_acuerdo: string | number;
  valor_cuota_acuerdo: string | null;
  estado_acuerdo: string;
  fecha_inicio: Date | string | null;
  fecha_limite: Date | string | null;
  creado_por: string | null;
  notas: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  id_cliente: string;
  nombre: string;
  email: string | null;
  telefono_celular: string | null;
  numero_credito: string;
  tipo_credito: string;
  deuda_original: string | null;
}

interface CuotaRow {
  numero_cuota: number;
  fecha_vencimiento: Date | string;
  fecha_pago: Date | string | null;
  valor_cuota_total: string | null;
  estado: string;
}

interface UltimoPagoRow {
  fecha_pago: Date | string;
  valor_pagado: string | null;
  medio_pago: string | null;
}

interface GestionRow {
  id: number;
  autor: string | null;
  created_at: Date | string;
  texto: string | null;
}

const fetchAcuerdoDetalle = async (id: number) => {
  const { rows: acuerdoRows } = await query<AcuerdoDetalleRow>(
    `
    SELECT
      a.id_acuerdo,
      a.id_credito,
      a.tipo_acuerdo,
      a.descuento_pct_mora,
      a.num_cuotas_acuerdo,
      a.valor_cuota_acuerdo,
      a.estado_acuerdo,
      a.fecha_inicio,
      a.fecha_limite,
      a.creado_por,
      a.notas,
      a.created_at,
      a.updated_at,
      cl.id_cliente,
      TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS nombre,
      cl.email,
      cl.telefono_celular,
      cr.numero_credito,
      cr.tipo_credito,
      cr.monto_desembolsado AS deuda_original
    FROM cartera.edu_acuerdos_pago a
    JOIN cartera.creditos cr ON cr.id_credito = a.id_credito
    JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
    WHERE a.id_acuerdo = $1
    `,
    [id],
  );
  if (acuerdoRows.length === 0) return null;
  const acuerdo = acuerdoRows[0];

  const fechaInicioYmd = fmtYmd(acuerdo.fecha_inicio) ?? new Date().toISOString().slice(0, 10);

  const [cuotasResult, ultimosPagosResult, totalPagadoResult, notasResult] = await Promise.all([
    query<CuotaRow>(
      `SELECT numero_cuota, fecha_vencimiento, fecha_pago, valor_cuota_total, estado
         FROM cartera.cuotas
        WHERE id_credito = $1
        ORDER BY numero_cuota ASC
        LIMIT 12`,
      [acuerdo.id_credito],
    ),
    query<UltimoPagoRow>(
      `SELECT fecha_pago, valor_pagado, medio_pago
         FROM cartera.pagos
        WHERE id_credito = $1
          AND fecha_pago >= $2
        ORDER BY fecha_pago DESC
        LIMIT 5`,
      [acuerdo.id_credito, fechaInicioYmd],
    ),
    query<{ total_pagado: string; cuotas_pagadas: string }>(
      `SELECT COALESCE(SUM(valor_pagado), 0)::text AS total_pagado,
              COUNT(*)::text                       AS cuotas_pagadas
         FROM cartera.pagos
        WHERE id_credito = $1
          AND fecha_pago >= $2`,
      [acuerdo.id_credito, fechaInicioYmd],
    ),
    query<GestionRow>(
      `SELECT id, canal AS autor, created_at, notas AS texto
         FROM cartera.mcp_gestiones
        WHERE id_credito = $1
        ORDER BY created_at DESC
        LIMIT 20`,
      [acuerdo.id_credito],
    ),
  ]);

  const cuotasRows = cuotasResult.rows;
  const ultimosPagosRows = ultimosPagosResult.rows;
  const totalPagado = numOrZero(totalPagadoResult.rows[0]?.total_pagado);
  const cuotasPagadasReal = numOrZero(totalPagadoResult.rows[0]?.cuotas_pagadas);
  const notasRows = notasResult.rows;

  const valorCuota = numOrZero(acuerdo.valor_cuota_acuerdo);
  const cuotasTotales = numOrZero(acuerdo.num_cuotas_acuerdo);
  const montoAcordado = Math.round(valorCuota * cuotasTotales);
  const estado = getEstadoUi(acuerdo.estado_acuerdo);
  const cumplimiento = computeCumplimiento(montoAcordado, Math.round(totalPagado));
  const today = startOfDay(new Date());

  // Cuotas del crédito subyacente (la amortización original). Se conserva el
  // shape histórico del detalle aunque el acuerdo no tenga cuotas propias.
  const cuotas = cuotasRows.map((c) => {
    const venc = toDate(c.fecha_vencimiento);
    let estadoCuota: 'Pagada' | 'Pendiente' | 'Atrasada';
    if (c.estado === 'PAGADA') {
      estadoCuota = 'Pagada';
    } else if (venc && venc < today) {
      estadoCuota = 'Atrasada';
    } else {
      estadoCuota = 'Pendiente';
    }
    return {
      numero: c.numero_cuota,
      fechaProgramada: fmtYmd(c.fecha_vencimiento) ?? '',
      fechaPago: fmtYmd(c.fecha_pago),
      monto: Math.round(numOrZero(c.valor_cuota_total)),
      estado: estadoCuota,
    };
  });

  return {
    id: formatAcuerdoId(acuerdo.id_acuerdo),
    clienteId: formatClienteId(acuerdo.id_cliente),
    clienteNombre: (acuerdo.nombre ?? '').trim() || 'Sin nombre',
    clienteEmail: acuerdo.email ?? null,
    clienteTelefono: acuerdo.telefono_celular ?? null,
    numeroCredito: acuerdo.numero_credito,
    tipoCredito: acuerdo.tipo_credito,
    tipoAcuerdo: acuerdo.tipo_acuerdo,
    deudaOriginal: Math.round(numOrZero(acuerdo.deuda_original)),
    montoAcordado,
    cuotasTotales,
    cuotasPagadas: cuotasPagadasReal,
    valorCuota: Math.round(valorCuota),
    descuentoPctMora: numOrZero(acuerdo.descuento_pct_mora),
    fechaInicio: fmtYmd(acuerdo.fecha_inicio),
    fechaLimite: fmtYmd(acuerdo.fecha_limite),
    // Conservamos `fechaFin` con el mismo valor de `fechaLimite` por compat
    // con consumidores legados del detalle.
    fechaFin: fmtYmd(acuerdo.fecha_limite),
    proximoPago:
      estado === 'Vigente'
        ? {
            fecha: fmtYmd(acuerdo.fecha_limite),
            monto: Math.round(valorCuota),
          }
        : null,
    estado,
    cumplimiento,
    gestor: acuerdo.creado_por ?? 'Sistema',
    creadoPor: acuerdo.creado_por,
    condiciones: acuerdo.notas ?? '',
    createdAt: fmtIso(acuerdo.created_at),
    updatedAt: fmtIso(acuerdo.updated_at),
    ultimosPagos: ultimosPagosRows.map((p) => ({
      fecha: fmtYmd(p.fecha_pago) ?? '',
      monto: Math.round(numOrZero(p.valor_pagado)),
      medioPago: p.medio_pago ?? null,
    })),
    cuotas,
    notas: notasRows.map((n) => ({
      id: n.id,
      autor: n.autor ?? 'Sistema',
      fecha: fmtYmd(n.created_at) ?? '',
      texto: n.texto ?? '',
    })),
  };
};

export const getAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseAcuerdoId(req.params.id);
    const data = await fetchAcuerdoDetalle(id);
    if (!data) throw notFound('Acuerdo no encontrado');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// POST /api/acuerdos
// =================================================================

export const createAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body ?? {};
    const idCredito = assertUuid(body.id_credito, 'id_credito');

    const tipoAcuerdo =
      typeof body.tipo_acuerdo === 'string' && body.tipo_acuerdo.trim()
        ? body.tipo_acuerdo.trim()
        : null;
    if (!tipoAcuerdo) throw badRequest('tipo_acuerdo es requerido');

    const descuentoPctMora = Number(body.descuento_pct_mora ?? 0);
    if (!Number.isFinite(descuentoPctMora) || descuentoPctMora < 0 || descuentoPctMora > 100) {
      throw badRequest('descuento_pct_mora debe estar entre 0 y 100');
    }

    const numCuotas = Number(body.num_cuotas_acuerdo);
    if (!Number.isInteger(numCuotas) || numCuotas <= 0) {
      throw badRequest('num_cuotas_acuerdo debe ser un entero > 0');
    }

    const valorCuota = Number(body.valor_cuota_acuerdo);
    if (!Number.isFinite(valorCuota) || valorCuota <= 0) {
      throw badRequest('valor_cuota_acuerdo debe ser > 0');
    }

    if (
      typeof body.fecha_limite !== 'string' ||
      !YMD_RE.test(body.fecha_limite)
    ) {
      throw badRequest('fecha_limite es requerida (YYYY-MM-DD)');
    }
    const fechaLimite = body.fecha_limite;
    const fl = new Date(fechaLimite);
    if (Number.isNaN(fl.getTime())) throw badRequest('fecha_limite inválida');
    if (startOfDay(fl) < startOfDay(new Date())) {
      throw badRequest('fecha_limite debe ser una fecha futura');
    }

    let fechaInicio: string | null = null;
    if (body.fecha_inicio !== undefined && body.fecha_inicio !== null) {
      if (typeof body.fecha_inicio !== 'string' || !YMD_RE.test(body.fecha_inicio)) {
        throw badRequest('fecha_inicio debe ser YYYY-MM-DD');
      }
      fechaInicio = body.fecha_inicio;
    }

    const notas = typeof body.notas === 'string' ? body.notas : null;
    const creadoPor = req.user?.name ?? 'gestor';

    // Verificar que el crédito exista (FK formal, pero validamos para
    // devolver un 400 con mensaje útil en lugar de un 500 de pg).
    const { rows: credito } = await query<{ id_credito: string }>(
      `SELECT id_credito FROM cartera.creditos WHERE id_credito = $1`,
      [idCredito],
    );
    if (credito.length === 0) {
      throw badRequest('id_credito no existe en cartera.creditos', 'INVALID_FK');
    }

    const { rows: inserted } = await query<{ id_acuerdo: number }>(
      `INSERT INTO cartera.edu_acuerdos_pago
         (id_credito, tipo_acuerdo, descuento_pct_mora, num_cuotas_acuerdo,
          valor_cuota_acuerdo, fecha_inicio, fecha_limite, creado_por, notas)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE), $7, $8, $9)
       RETURNING id_acuerdo`,
      [
        idCredito,
        tipoAcuerdo,
        descuentoPctMora,
        numCuotas,
        valorCuota,
        fechaInicio,
        fechaLimite,
        creadoPor,
        notas,
      ],
    );

    const data = await fetchAcuerdoDetalle(inserted[0].id_acuerdo);
    if (!data) throw notFound('No se pudo recuperar el acuerdo creado');
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// PUT /api/acuerdos/:id — actualización parcial
// =================================================================
//
// Solo permite actualizar: notas, fecha_limite, valor_cuota_acuerdo,
// estado_acuerdo. Otros campos quedan inmutables.

export const updateAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseAcuerdoId(req.params.id);
    const body = (req.body ?? {}) as Record<string, unknown>;

    let notas: string | null | undefined = undefined;
    if (Object.prototype.hasOwnProperty.call(body, 'notas')) {
      notas = typeof body.notas === 'string' ? body.notas : null;
    }

    let fechaLimite: string | null | undefined = undefined;
    if (body.fecha_limite !== undefined) {
      if (typeof body.fecha_limite !== 'string' || !YMD_RE.test(body.fecha_limite)) {
        throw badRequest('fecha_limite debe ser YYYY-MM-DD');
      }
      if (Number.isNaN(new Date(body.fecha_limite).getTime())) {
        throw badRequest('fecha_limite inválida');
      }
      fechaLimite = body.fecha_limite;
    }

    let valorCuota: number | undefined = undefined;
    if (body.valor_cuota_acuerdo !== undefined) {
      const v = Number(body.valor_cuota_acuerdo);
      if (!Number.isFinite(v) || v <= 0) {
        throw badRequest('valor_cuota_acuerdo debe ser > 0');
      }
      valorCuota = v;
    }

    let estadoDb: string | undefined = undefined;
    if (body.estado_acuerdo !== undefined) {
      const raw = String(body.estado_acuerdo).trim();
      const candidato =
        ESTADO_UI_TO_DB[raw] ?? raw.toUpperCase();
      if (!(ESTADOS_DB_VALIDOS as readonly string[]).includes(candidato)) {
        throw badRequest(
          `estado_acuerdo debe ser uno de: ${ESTADOS_DB_VALIDOS.join(', ')}`,
        );
      }
      estadoDb = candidato;
    }

    if (
      notas === undefined &&
      fechaLimite === undefined &&
      valorCuota === undefined &&
      estadoDb === undefined
    ) {
      throw badRequest('No hay campos válidos para actualizar');
    }

    const { rowCount } = await query(
      `UPDATE cartera.edu_acuerdos_pago
          SET notas               = COALESCE($1, notas),
              fecha_limite        = COALESCE($2::date, fecha_limite),
              valor_cuota_acuerdo = COALESCE($3, valor_cuota_acuerdo),
              estado_acuerdo      = COALESCE($4::cartera.estado_acuerdo_enum, estado_acuerdo),
              updated_at          = NOW()
        WHERE id_acuerdo = $5`,
      [
        notas ?? null,
        fechaLimite ?? null,
        valorCuota ?? null,
        estadoDb ?? null,
        id,
      ],
    );
    if (!rowCount) throw notFound('Acuerdo no encontrado');

    const data = await fetchAcuerdoDetalle(id);
    if (!data) throw notFound('Acuerdo no encontrado');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// POST /api/acuerdos/:id/pagos
// =================================================================

export const registrarPago = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const id = parseAcuerdoId(req.params.id);

    const monto = Number(req.body?.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      throw badRequest('monto debe ser un número mayor a 0');
    }

    const fecha = req.body?.fecha;
    if (typeof fecha !== 'string' || !YMD_RE.test(fecha)) {
      throw badRequest('fecha es requerida (YYYY-MM-DD)');
    }
    if (Number.isNaN(new Date(fecha).getTime())) {
      throw badRequest('fecha inválida');
    }

    await client.query('BEGIN');

    const { rows: acuerdoRows } = await client.query(
      `SELECT id_credito, valor_cuota_acuerdo, num_cuotas_acuerdo, fecha_inicio
         FROM cartera.edu_acuerdos_pago
        WHERE id_acuerdo = $1`,
      [id],
    );
    if (acuerdoRows.length === 0) throw notFound('Acuerdo no encontrado');
    const acuerdo = acuerdoRows[0];

    await client.query(
      `INSERT INTO cartera.pagos (
         id_credito, valor_pagado, valor_capital_abonado,
         valor_intereses_abonado, valor_mora_abonado, valor_seguro_abonado,
         fecha_pago, fecha_aplicacion, medio_pago, referencia_pago
       ) VALUES (
         $1, $2, $2, 0, 0, 0,
         $3, $3, 'TRANSFERENCIA',
         'ACU-' || $4::text || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS')
       )`,
      [acuerdo.id_credito, monto, fecha, id],
    );

    // Si la suma de pagos desde fecha_inicio cubre el monto acordado,
    // marcar el acuerdo como CUMPLIDO.
    const { rows: totalRows } = await client.query<{ total_pagado: string }>(
      `SELECT COALESCE(SUM(valor_pagado), 0)::text AS total_pagado
         FROM cartera.pagos
        WHERE id_credito = $1
          AND fecha_pago >= $2`,
      [acuerdo.id_credito, acuerdo.fecha_inicio],
    );
    const totalPagado = numOrZero(totalRows[0]?.total_pagado);
    const montoAcordado =
      numOrZero(acuerdo.valor_cuota_acuerdo) * numOrZero(acuerdo.num_cuotas_acuerdo);
    if (montoAcordado > 0 && totalPagado >= montoAcordado) {
      await client.query(
        `UPDATE cartera.edu_acuerdos_pago
            SET estado_acuerdo = 'CUMPLIDO', updated_at = NOW()
          WHERE id_acuerdo = $1`,
        [id],
      );
    }

    await client.query('COMMIT');

    const data = await fetchAcuerdoDetalle(id);
    if (!data) throw notFound('Acuerdo no encontrado');
    res.status(201).json({ success: true, data });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* noop */
    }
    next(err);
  } finally {
    client.release();
  }
};

// =================================================================
// POST /api/acuerdos/:id/incumplir
// =================================================================

export const marcarIncumplido = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseAcuerdoId(req.params.id);
    const motivo =
      typeof req.body?.motivo === 'string' && req.body.motivo.trim()
        ? req.body.motivo.trim()
        : 'Sin motivo';

    const { rowCount } = await query(
      `UPDATE cartera.edu_acuerdos_pago
          SET estado_acuerdo = 'INCUMPLIDO',
              notas = COALESCE(notas, '') || E'\\nIncumplido: ' || $1,
              updated_at = NOW()
        WHERE id_acuerdo = $2`,
      [motivo, id],
    );
    if (!rowCount) throw notFound('Acuerdo no encontrado');

    const data = await fetchAcuerdoDetalle(id);
    if (!data) throw notFound('Acuerdo no encontrado');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// POST /api/acuerdos/:id/notas
// =================================================================
//
// Las notas/gestiones siguen viviendo en cartera.mcp_gestiones — no en
// edu_acuerdos_pago. Insertamos contra el id_credito del acuerdo.

export const createNotaAcuerdo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseAcuerdoId(req.params.id);
    const texto =
      typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
    if (!texto) throw badRequest('texto es requerido');

    const { rows: acuerdoRows } = await query<{ id_credito: string }>(
      `SELECT id_credito FROM cartera.edu_acuerdos_pago WHERE id_acuerdo = $1`,
      [id],
    );
    if (acuerdoRows.length === 0) throw notFound('Acuerdo no encontrado');

    const { rows: inserted } = await query<{ id: number; created_at: Date | string }>(
      `INSERT INTO cartera.mcp_gestiones
         (id_credito, canal, resultado, notas, created_at)
       VALUES ($1, 'sistema', 'enviado', $2, NOW())
       RETURNING id, created_at`,
      [acuerdoRows[0].id_credito, texto],
    );

    const row = inserted[0];
    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        autor: req.user?.name ?? 'Sistema',
        fecha: fmtYmd(row.created_at) ?? '',
        texto,
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// DELETE /api/acuerdos/:id — soft delete (estado → INCUMPLIDO)
// =================================================================

export const deleteAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseAcuerdoId(req.params.id);
    const { rows } = await query<{ id_acuerdo: number }>(
      `UPDATE cartera.edu_acuerdos_pago
          SET estado_acuerdo = 'INCUMPLIDO', updated_at = NOW()
        WHERE id_acuerdo = $1
        RETURNING id_acuerdo`,
      [id],
    );
    if (rows.length === 0) throw notFound('Acuerdo no encontrado');

    res.json({
      success: true,
      data: {
        id: formatAcuerdoId(rows[0].id_acuerdo),
        estado: 'Incumplido',
        message: 'Acuerdo cancelado',
      },
    });
  } catch (err) {
    next(err);
  }
};
