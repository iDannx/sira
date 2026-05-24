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
  const m = /^A-(\d{1,10})$/.exec(raw);
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

type EstadoAcuerdo = 'Vigente' | 'Cumplido' | 'Incumplido' | 'Vencido';
type EstadoCuota = 'Pagada' | 'Pendiente' | 'Atrasada';

const getEstadoAcuerdo = (
  fechaPromesa: Date | null,
  valorPromesa: number,
  totalPagado: number,
): EstadoAcuerdo => {
  if (valorPromesa > 0 && totalPagado >= valorPromesa) return 'Cumplido';
  if (!fechaPromesa) return 'Vigente';
  const hoy = startOfDay(new Date());
  const fp = startOfDay(fechaPromesa);
  const treintaAtras = new Date(hoy);
  treintaAtras.setDate(treintaAtras.getDate() - 30);
  if (fp < treintaAtras) return 'Vencido';
  if (fp < hoy) return 'Incumplido';
  return 'Vigente';
};

const computeCumplimiento = (montoAcordado: number, totalPagado: number): number => {
  if (montoAcordado <= 0) return 0;
  return Math.min(100, Math.round((totalPagado / montoAcordado) * 100));
};

// =================================================================
// Endpoint 1 — GET /api/acuerdos/resumen
// =================================================================

interface ResumenRow {
  vigentes: string;
  cumplidos_mes: string;
  incumplidos: string;
  monto_comprometido: string;
}

export const getResumen = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT
        COUNT(*) FILTER (
          WHERE mc.resultado = 'promesa_pago'
            AND mc.fecha_promesa >= CURRENT_DATE
        )                                                          AS vigentes,
        COUNT(*) FILTER (
          WHERE mc.resultado = 'promesa_pago'
            AND p.valor_pagado >= mc.valor_promesa
        )                                                          AS cumplidos_mes,
        COUNT(*) FILTER (
          WHERE mc.resultado IN ('promesa_pago')
            AND mc.fecha_promesa < CURRENT_DATE
            AND (p.valor_pagado IS NULL OR p.valor_pagado < mc.valor_promesa)
        )                                                          AS incumplidos,
        COALESCE(SUM(mc.valor_promesa), 0)                         AS monto_comprometido
      FROM cartera.mcp_gestiones mc
      LEFT JOIN cartera.pagos p
             ON p.id_credito = mc.id_credito
            AND p.fecha_pago >= mc.created_at::date
      WHERE mc.resultado = 'promesa_pago'
    `;
    const { rows } = await query<ResumenRow>(sql);
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
// Endpoint 2 — GET /api/acuerdos
// =================================================================

// Columnas del CTE `base` que pueden usarse en ORDER BY (whitelisted).
const SORT_COLS: Record<string, string> = {
  cliente: 'cliente_nombre',
  monto: 'valor_promesa',
  cuotas: 'cuotas_pagadas',
  proximoPago: 'fecha_promesa',
  cumplimiento: 'total_pagado',
  estado: 'fecha_promesa',
};

const RANGOS_FECHA: Record<string, string> = {
  semana: `fecha_promesa BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`,
  mes: `fecha_promesa BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`,
  vencido: `fecha_promesa < CURRENT_DATE`,
};

const ESTADOS_VALIDOS: readonly EstadoAcuerdo[] = [
  'Vigente',
  'Cumplido',
  'Incumplido',
  'Vencido',
];

interface AcuerdoListRow {
  id: number;
  id_credito: string;
  id_cliente: string;
  cliente_nombre: string;
  valor_promesa: string;
  fecha_promesa: Date | string | null;
  resultado: string;
  created_at: Date | string;
  cuotas_totales: string;
  cuotas_pagadas: string;
  total_pagado: string;
  total_count: string;
}

export const listAcuerdos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : null;
    const estadoFilter =
      typeof req.query.estado === 'string' ? req.query.estado : null;
    const rangoFecha =
      typeof req.query.rangoFecha === 'string' ? req.query.rangoFecha : null;

    const sortByRaw =
      typeof req.query.sortBy === 'string' ? req.query.sortBy : 'proximoPago';
    const sortDirRaw =
      typeof req.query.sortDir === 'string' ? req.query.sortDir.toLowerCase() : 'desc';
    const sortBy = SORT_COLS[sortByRaw] ? sortByRaw : 'proximoPago';
    const sortDir = sortDirRaw === 'asc' ? 'ASC' : 'DESC';
    const orderCol = SORT_COLS[sortBy];

    // Filtros aplicados ANTES de la agregación (en el WHERE del CTE base).
    const innerConditions: string[] = [`mc.resultado = 'promesa_pago'`];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const i = params.length;
      innerConditions.push(
        `(
          (cl.primer_nombre || ' ' || cl.primer_apellido) ILIKE $${i}
          OR cl.id_cliente::text ILIKE $${i}
          OR mc.id::text ILIKE $${i}
        )`,
      );
    }

    // Filtros aplicados DESPUÉS de la agregación (sobre el CTE base).
    const outerConditions: string[] = [];

    if (rangoFecha && RANGOS_FECHA[rangoFecha]) {
      outerConditions.push(RANGOS_FECHA[rangoFecha]);
    }

    if (estadoFilter && (ESTADOS_VALIDOS as readonly string[]).includes(estadoFilter)) {
      switch (estadoFilter as EstadoAcuerdo) {
        case 'Cumplido':
          outerConditions.push(`valor_promesa > 0 AND total_pagado >= valor_promesa`);
          break;
        case 'Vencido':
          outerConditions.push(
            `total_pagado < valor_promesa AND fecha_promesa < CURRENT_DATE - INTERVAL '30 days'`,
          );
          break;
        case 'Incumplido':
          outerConditions.push(
            `total_pagado < valor_promesa
             AND fecha_promesa < CURRENT_DATE
             AND fecha_promesa >= CURRENT_DATE - INTERVAL '30 days'`,
          );
          break;
        case 'Vigente':
          outerConditions.push(
            `(total_pagado < valor_promesa OR valor_promesa = 0) AND fecha_promesa >= CURRENT_DATE`,
          );
          break;
      }
    }

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const sql = `
      WITH base AS (
        SELECT
          mc.id,
          mc.id_credito,
          cl.id_cliente,
          TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS cliente_nombre,
          mc.valor_promesa,
          mc.fecha_promesa,
          mc.resultado,
          mc.created_at,
          COUNT(cu.id_cuota)                                              AS cuotas_totales,
          COUNT(cu.id_cuota) FILTER (WHERE cu.estado = 'PAGADA')          AS cuotas_pagadas,
          COALESCE(SUM(p.valor_pagado) FILTER (
            WHERE p.fecha_pago >= mc.created_at::date
          ), 0)                                                            AS total_pagado
        FROM cartera.mcp_gestiones mc
        JOIN cartera.creditos cr ON cr.id_credito = mc.id_credito
        JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
        LEFT JOIN cartera.cuotas cu ON cu.id_credito = mc.id_credito
        LEFT JOIN cartera.pagos  p  ON p.id_credito  = mc.id_credito
        WHERE ${innerConditions.join(' AND ')}
        GROUP BY mc.id, mc.id_credito, cl.id_cliente,
                 cl.primer_nombre, cl.primer_apellido,
                 mc.valor_promesa, mc.fecha_promesa, mc.resultado, mc.created_at
      )
      SELECT *, COUNT(*) OVER() AS total_count
      FROM base
      ${outerConditions.length ? `WHERE ${outerConditions.join(' AND ')}` : ''}
      ORDER BY ${orderCol} ${sortDir} NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    params.push(limit);
    params.push(offset);

    const { rows } = await query<AcuerdoListRow>(sql, params);
    const total = rows[0] ? Number(rows[0].total_count) : 0;

    const data = rows.map((row) => {
      const fechaPromesa = toDate(row.fecha_promesa);
      const valorPromesa = numOrZero(row.valor_promesa);
      const totalPagado = numOrZero(row.total_pagado);
      const cuotasTotales = numOrZero(row.cuotas_totales);
      const estado = getEstadoAcuerdo(fechaPromesa, valorPromesa, totalPagado);
      const cumplimiento = computeCumplimiento(valorPromesa, totalPagado);
      const sinProximoPago = estado !== 'Vigente';
      const divisor = cuotasTotales > 0 ? cuotasTotales : 1;

      return {
        id: formatAcuerdoId(row.id),
        clienteId: formatClienteId(row.id_cliente),
        clienteNombre: (row.cliente_nombre ?? '').trim() || 'Sin nombre',
        montoAcordado: Math.round(valorPromesa),
        cuotasPagadas: numOrZero(row.cuotas_pagadas),
        cuotasTotales,
        proximoPago: sinProximoPago
          ? null
          : {
              fecha: fmtYmd(fechaPromesa) ?? '',
              monto: Math.round(valorPromesa / divisor),
            },
        cumplimiento,
        estado,
      };
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

// =================================================================
// Endpoint 3 — GET /api/acuerdos/:id (también reutilizado por POSTs)
// =================================================================

interface AcuerdoDetalleRow {
  id: number;
  id_credito: string;
  valor_promesa: string;
  fecha_promesa: Date | string | null;
  condiciones: string | null;
  created_at: Date | string;
  canal: string | null;
  id_cliente: string;
  nombre: string;
  email: string | null;
  telefono_celular: string | null;
  deuda_original: string | null;
  valor_cuota: string | null;
  fecha_inicio: Date | string | null;
  fecha_fin: Date | string | null;
}

interface CuotaRow {
  numero_cuota: number;
  fecha_vencimiento: Date | string;
  fecha_pago: Date | string | null;
  valor_cuota_total: string | null;
  estado: string;
}

interface GestionDetalleRow {
  id: number;
  autor: string | null;
  created_at: Date | string;
  texto: string | null;
}

const fetchAcuerdoDetalle = async (id: number, gestorNombre: string) => {
  const { rows: acuerdoRows } = await query<AcuerdoDetalleRow>(
    `SELECT
       mc.id, mc.id_credito, mc.valor_promesa, mc.fecha_promesa,
       mc.notas AS condiciones, mc.created_at, mc.canal,
       cl.id_cliente,
       TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS nombre,
       cl.email, cl.telefono_celular,
       cr.monto_desembolsado    AS deuda_original,
       cr.valor_cuota,
       cr.fecha_desembolso      AS fecha_inicio,
       cr.fecha_ultima_cuota    AS fecha_fin
     FROM cartera.mcp_gestiones mc
     JOIN cartera.creditos cr ON cr.id_credito = mc.id_credito
     JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
     WHERE mc.id = $1`,
    [id],
  );
  if (acuerdoRows.length === 0) return null;
  const acuerdo = acuerdoRows[0];

  const createdAtYmd =
    fmtYmd(acuerdo.created_at) ?? new Date().toISOString().slice(0, 10);

  const [cuotasResult, totalPagadoResult, notasResult] = await Promise.all([
    query<CuotaRow>(
      `SELECT numero_cuota, fecha_vencimiento, fecha_pago,
              valor_cuota_total, estado
         FROM cartera.cuotas
        WHERE id_credito = $1
        ORDER BY numero_cuota ASC
        LIMIT 12`,
      [acuerdo.id_credito],
    ),
    query<{ total_pagado: string }>(
      `SELECT COALESCE(SUM(valor_pagado), 0)::text AS total_pagado
         FROM cartera.pagos
        WHERE id_credito = $1
          AND fecha_pago >= $2`,
      [acuerdo.id_credito, createdAtYmd],
    ),
    query<GestionDetalleRow>(
      // Filtramos los `promesa_pago` para que el propio acuerdo (y otros
      // acuerdos del mismo crédito) no se muestren a sí mismos como notas.
      // Antes del rename eso ya funcionaba porque acuerdos y notas vivían
      // en tablas distintas; ahora comparten cartera.mcp_gestiones.
      `SELECT id, canal AS autor, created_at, notas AS texto
         FROM cartera.mcp_gestiones
        WHERE id_credito = $1
          AND resultado <> 'promesa_pago'
        ORDER BY created_at DESC`,
      [acuerdo.id_credito],
    ),
  ]);

  const cuotasRows = cuotasResult.rows;
  const totalPagado = numOrZero(totalPagadoResult.rows[0]?.total_pagado);
  const notasRows = notasResult.rows;

  const valorPromesa = numOrZero(acuerdo.valor_promesa);
  const fechaPromesa = toDate(acuerdo.fecha_promesa);
  const estado = getEstadoAcuerdo(fechaPromesa, valorPromesa, totalPagado);
  const cumplimiento = computeCumplimiento(valorPromesa, totalPagado);
  const today = startOfDay(new Date());

  const cuotas = cuotasRows.map((c) => {
    const venc = toDate(c.fecha_vencimiento);
    let estadoCuota: EstadoCuota;
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
    id: formatAcuerdoId(acuerdo.id),
    clienteId: formatClienteId(acuerdo.id_cliente),
    clienteNombre: (acuerdo.nombre ?? '').trim() || 'Sin nombre',
    clienteEmail: acuerdo.email ?? null,
    clienteTelefono: acuerdo.telefono_celular ?? null,
    deudaOriginal: Math.round(numOrZero(acuerdo.deuda_original)),
    montoAcordado: Math.round(valorPromesa),
    cuotasTotales: cuotas.length,
    cuotasPagadas: cuotas.filter((c) => c.estado === 'Pagada').length,
    valorCuota: Math.round(numOrZero(acuerdo.valor_cuota)),
    fechaInicio: fmtYmd(acuerdo.fecha_inicio),
    fechaFin: fmtYmd(acuerdo.fecha_fin),
    proximoPago:
      estado === 'Vigente'
        ? {
            fecha: fmtYmd(acuerdo.fecha_promesa) ?? '',
            monto: Math.round(numOrZero(acuerdo.valor_cuota)),
          }
        : null,
    estado,
    cumplimiento,
    gestor: gestorNombre,
    condiciones: acuerdo.condiciones ?? '',
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
    const data = await fetchAcuerdoDetalle(id, req.user?.name ?? 'Sistema');
    if (!data) throw notFound('Acuerdo no encontrado');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// Endpoint 4 — POST /api/acuerdos/:id/pagos
// =================================================================

export const registrarPago = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseAcuerdoId(req.params.id);

    const monto = Number(req.body?.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      throw badRequest('monto debe ser un número mayor a 0');
    }

    const fecha = req.body?.fecha;
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw badRequest('fecha es requerida (YYYY-MM-DD)');
    }
    if (Number.isNaN(new Date(fecha).getTime())) {
      throw badRequest('fecha inválida');
    }

    const { rows: acuerdoRows } = await query<{ id_credito: string }>(
      `SELECT id_credito FROM cartera.mcp_gestiones WHERE id = $1`,
      [id],
    );
    if (acuerdoRows.length === 0) throw notFound('Acuerdo no encontrado');

    await query(
      `INSERT INTO cartera.pagos (
         id_credito, valor_pagado, valor_capital_abonado,
         valor_intereses_abonado, valor_mora_abonado, valor_seguro_abonado,
         fecha_pago, fecha_aplicacion, medio_pago, referencia_pago
       ) VALUES (
         $1, $2, $2, 0, 0, 0,
         $3, $3, 'TRANSFERENCIA',
         'ACU-' || $4::text || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS')
       )`,
      [acuerdoRows[0].id_credito, monto, fecha, id],
    );

    const data = await fetchAcuerdoDetalle(id, req.user?.name ?? 'Sistema');
    if (!data) throw notFound('Acuerdo no encontrado');
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// Endpoint 5 — POST /api/acuerdos/:id/incumplir
// =================================================================

export const marcarIncumplido = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const client = await pool.connect();
  try {
    const id = parseAcuerdoId(req.params.id);
    const motivo =
      typeof req.body?.motivo === 'string' && req.body.motivo.trim()
        ? req.body.motivo.trim()
        : 'Sin motivo';

    const { rows: acuerdoRows } = await client.query(
      `SELECT id_credito FROM cartera.mcp_gestiones WHERE id = $1`,
      [id],
    );
    if (acuerdoRows.length === 0) throw notFound('Acuerdo no encontrado');
    const idCredito = acuerdoRows[0].id_credito;

    await client.query('BEGIN');
    await client.query(
      `INSERT INTO cartera.mcp_gestiones (id_credito, canal, resultado, notas)
       VALUES ($1, 'sistema', 'rechazado', $2)`,
      [idCredito, motivo],
    );
    await client.query(
      `UPDATE cartera.mcp_gestiones
          SET notas = COALESCE(notas, '') || E'\\nIncumplido: ' || $1
        WHERE id = $2`,
      [motivo, id],
    );
    await client.query('COMMIT');

    const data = await fetchAcuerdoDetalle(id, req.user?.name ?? 'Sistema');
    if (!data) throw notFound('Acuerdo no encontrado');
    res.json({ success: true, data });
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
// Endpoint 6 — POST /api/acuerdos/:id/notas
// =================================================================

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
      `SELECT id_credito FROM cartera.mcp_gestiones WHERE id = $1`,
      [id],
    );
    if (acuerdoRows.length === 0) throw notFound('Acuerdo no encontrado');

    const { rows: inserted } = await query<{ id: number; created_at: Date | string }>(
      `INSERT INTO cartera.mcp_gestiones (id_credito, canal, resultado, notas, created_at)
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
// Endpoint 7 — POST /api/acuerdos (nuevo acuerdo)
// =================================================================

export const createAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body ?? {};
    const idCredito = assertUuid(body.id_credito, 'id_credito');

    const valorPromesa = Number(body.valor_promesa);
    if (!Number.isFinite(valorPromesa) || valorPromesa <= 0) {
      throw badRequest('valor_promesa debe ser mayor a 0');
    }

    const fechaPromesa = body.fecha_promesa;
    if (typeof fechaPromesa !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaPromesa)) {
      throw badRequest('fecha_promesa es requerida (YYYY-MM-DD)');
    }
    const fp = new Date(fechaPromesa);
    if (Number.isNaN(fp.getTime())) throw badRequest('fecha_promesa inválida');
    if (startOfDay(fp) < startOfDay(new Date())) {
      throw badRequest('fecha_promesa debe ser una fecha futura');
    }

    const canal = typeof body.canal === 'string' ? body.canal : 'manual';
    const notas = typeof body.notas === 'string' ? body.notas : null;

    // mcp_gestiones.id_credito no tiene FK formal; validamos a mano que el
    // crédito exista antes de insertar para no crear gestiones huérfanas.
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
       VALUES ($1, $2, 'promesa_pago', $3, $4, $5, NOW())
       RETURNING id`,
      [idCredito, canal, valorPromesa, fechaPromesa, notas],
    );
    const id = inserted[0].id;

    const data = await fetchAcuerdoDetalle(id, req.user?.name ?? 'Sistema');
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
// Whitelist: notas, fecha_promesa, valor_promesa. El campo `respuesta` ya
// no existe en mcp_gestiones; se removió a propósito.

const UPDATABLE_FIELDS = ['notas', 'fecha_promesa', 'valor_promesa'] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

export const updateAcuerdo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseAcuerdoId(req.params.id);
    const body = (req.body ?? {}) as Record<string, unknown>;

    const setClauses: string[] = [];
    const params: unknown[] = [];

    for (const field of UPDATABLE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
      const value: unknown = body[field as UpdatableField];

      if (field === 'valor_promesa') {
        const v = Number(value);
        if (!Number.isFinite(v) || v <= 0) {
          throw badRequest('valor_promesa debe ser mayor a 0');
        }
        params.push(v);
      } else if (field === 'fecha_promesa') {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          throw badRequest('fecha_promesa debe ser YYYY-MM-DD');
        }
        if (Number.isNaN(new Date(value).getTime())) {
          throw badRequest('fecha_promesa inválida');
        }
        params.push(value);
      } else {
        // notas: acepta string o null para limpiar.
        params.push(value === null ? null : String(value ?? ''));
      }

      setClauses.push(`${field} = $${params.length}`);
    }

    if (setClauses.length === 0) {
      throw badRequest('No hay campos válidos para actualizar');
    }

    params.push(id);
    const { rowCount } = await query(
      `UPDATE cartera.mcp_gestiones
          SET ${setClauses.join(', ')}
        WHERE id = $${params.length}`,
      params,
    );
    if (!rowCount) throw notFound('Acuerdo no encontrado');

    const data = await fetchAcuerdoDetalle(id, req.user?.name ?? 'Sistema');
    if (!data) throw notFound('Acuerdo no encontrado');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
