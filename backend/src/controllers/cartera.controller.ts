import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { assertUuid, parsePagination } from '../utils/validate';
import { getLatestCorte } from '../utils/carteraCache';
import { badRequest, notFound } from '../utils/httpError';

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

// =================================================================
// Helpers compartidos por los endpoints /resumen, /clientes, /exportar
// =================================================================

const formatCOP = (n: number): string =>
  new Intl.NumberFormat('es-CO').format(Math.round(n));

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

const tendenciaPct = (actual: number, anterior: number): string => {
  if (!anterior || anterior === 0) return '+0.0%';
  const pct = ((actual - anterior) / anterior) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

const getRiesgo = (cal: string | null): 'Alto' | 'Medio' | 'Bajo' => {
  if (cal === 'E') return 'Alto';
  if (cal === 'C' || cal === 'D') return 'Medio';
  return 'Bajo';
};

const getEstado = (estado: string | null): 'Al día' | 'En mora' | 'Castigada' => {
  if (estado === 'EN_MORA') return 'En mora';
  if (estado === 'CASTIGADO') return 'Castigada';
  return 'Al día';
};

const getTipoProducto = (tipo: string | null): string => {
  const map: Record<string, string> = {
    CONSUMO: 'Crédito de consumo',
    LIBRE_INVERSION: 'Crédito libre inversión',
    VEHICULO: 'Crédito vehículo',
    HIPOTECARIO: 'Crédito hipotecario',
    MICROCREDITO: 'Microcrédito',
    TARJETA_CREDITO: 'Tarjeta de crédito',
  };
  return (tipo && map[tipo]) || tipo || 'Crédito';
};

const getComportamientoDetalle = (diasMora: number): string => {
  if (diasMora === 0) return 'Pagador puntual, sin mora activa.';
  if (diasMora <= 30) return `Mora leve de ${diasMora} días, primera incidencia.`;
  if (diasMora <= 90) return `Mora moderada de ${diasMora} días, requiere seguimiento.`;
  return `Mora crítica de ${diasMora} días, gestión prioritaria.`;
};

const getEstrategiaResumenCorto = (diasMora: number): string => {
  if (diasMora > 120) {
    return 'Escalar a cobro jurídico. Contacto inmediato por abogado asignado.';
  }
  if (diasMora > 30) return 'Llamada prioritaria + propuesta de reestructuración.';
  return `WhatsApp empático + recordatorio de pago. Mora de ${diasMora} días.`;
};

const sugerirProductoCrossSell = (tipoCredito: string | null): string => {
  switch (tipoCredito) {
    case 'CONSUMO':
      return 'Crédito vehículo';
    case 'MICROCREDITO':
      return 'Crédito de libre inversión';
    case 'HIPOTECARIO':
      return 'Seguro de vida hogar';
    case 'VEHICULO':
      return 'Crédito hipotecario';
    case 'TARJETA_CREDITO':
      return 'Crédito de libre inversión';
    default:
      return 'Crédito de libre inversión';
  }
};

const formatClienteId = (uuid: string): string =>
  `C-${uuid.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

// Decodifica un id "C-XXXXXXXX" en el prefijo hex (8 chars, lowercase)
// y lanza badRequest si el formato es inválido.
const parseClienteIdParam = (raw: string | undefined): string => {
  if (typeof raw !== 'string') throw badRequest('id inválido');
  const m = /^C-([0-9A-Fa-f]{8})$/.exec(raw);
  if (!m) throw badRequest('id debe tener formato C-XXXXXXXX (8 hex)');
  return m[1].toLowerCase();
};

// Mapeos de los filtros del frontend hacia valores reales de BD
const RIESGO_TO_CALIF: Record<string, string[]> = {
  Alto: ['E'],
  Medio: ['C', 'D'],
  Bajo: ['A', 'B'],
};

const ESTADO_TO_DB: Record<string, string> = {
  'Al día': 'VIGENTE',
  'En mora': 'EN_MORA',
  Castigada: 'CASTIGADO',
};

const RANGOS_MORA: Record<string, [number, number | null]> = {
  '1-30': [1, 30],
  '31-60': [31, 60],
  '61-90': [61, 90],
  '+90': [91, null],
};

const SORT_COLS: Record<string, string> = {
  nombre: "cl.primer_nombre || ' ' || cl.primer_apellido",
  deudaTotal: 'c.saldo_total',
  diasMora: 'c.dias_mora',
  ultimoPago: 'c.fecha_ultimo_pago',
  riesgo: 'c.calificacion',
  estado: 'cr.estado',
};

interface ClientesFilters {
  search: string | null;
  riesgo: string | null;
  estado: string | null;
  rangoMora: string | null;
  sortBy: string;
  sortDir: 'ASC' | 'DESC';
}

const readClientesFilters = (q: Request['query']): ClientesFilters => {
  const search = typeof q.search === 'string' ? q.search.trim() : null;
  const riesgo = typeof q.riesgo === 'string' ? q.riesgo : null;
  const estado = typeof q.estado === 'string' ? q.estado : null;
  const rangoMora = typeof q.rangoMora === 'string' ? q.rangoMora : null;
  const sortByRaw = typeof q.sortBy === 'string' ? q.sortBy : 'diasMora';
  const sortDirRaw = typeof q.sortDir === 'string' ? q.sortDir.toLowerCase() : 'desc';
  const sortBy = SORT_COLS[sortByRaw] ? sortByRaw : 'diasMora';
  const sortDir: 'ASC' | 'DESC' = sortDirRaw === 'asc' ? 'ASC' : 'DESC';
  return { search, riesgo, estado, rangoMora, sortBy, sortDir };
};

// Construye el WHERE dinámico y los params para las queries de clientes/exportar.
// $1 está reservado siempre para la fecha de corte.
const buildClientesWhere = (
  filters: ClientesFilters,
  fechaCorte: string,
): { whereSql: string; params: unknown[] } => {
  const conditions: string[] = ['c.fecha_corte = $1'];
  const params: unknown[] = [fechaCorte];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    const i = params.length;
    conditions.push(
      `((cl.primer_nombre || ' ' || cl.primer_apellido) ILIKE $${i} OR cl.numero_documento ILIKE $${i})`,
    );
  }

  if (filters.riesgo) {
    const cals = RIESGO_TO_CALIF[filters.riesgo];
    if (cals) {
      params.push(cals);
      conditions.push(`c.calificacion = ANY($${params.length}::text[])`);
    }
  }

  if (filters.estado) {
    const dbEstado = ESTADO_TO_DB[filters.estado];
    if (dbEstado) {
      params.push(dbEstado);
      conditions.push(`cr.estado = $${params.length}`);
    }
  }

  if (filters.rangoMora) {
    const range = RANGOS_MORA[filters.rangoMora];
    if (range) {
      const [min, max] = range;
      if (max !== null) {
        params.push(min);
        params.push(max);
        conditions.push(`c.dias_mora BETWEEN $${params.length - 1} AND $${params.length}`);
      } else {
        params.push(min);
        conditions.push(`c.dias_mora >= $${params.length}`);
      }
    }
  }

  return { whereSql: conditions.join(' AND '), params };
};

interface ClienteListRow {
  id_cliente: string;
  nombre: string;
  deuda_total: string | null;
  dias_mora: string | number | null;
  calificacion: string;
  ultimo_pago: Date | string | null;
  estado_credito: string;
  total_count: string;
}

interface ClienteListItem {
  id: string;
  nombre: string;
  deudaTotal: number;
  diasMora: number;
  ultimoPago: string | null;
  riesgo: 'Alto' | 'Medio' | 'Bajo';
  estado: 'Al día' | 'En mora' | 'Castigada';
}

const mapClienteListRow = (row: ClienteListRow): ClienteListItem => ({
  id: formatClienteId(row.id_cliente),
  nombre: (row.nombre ?? '').trim() || 'Sin nombre',
  deudaTotal: Math.round(numOrZero(row.deuda_total)),
  diasMora: numOrZero(row.dias_mora),
  ultimoPago: fmtYmd(row.ultimo_pago),
  riesgo: getRiesgo(row.calificacion),
  estado: getEstado(row.estado_credito),
});

// =================================================================
// Endpoint 1 — GET /api/cartera/resumen
// =================================================================

interface ResumenRow {
  total: string | null;
  vencida: string | null;
  al_dia: string | null;
  recuperado_mes: string | null;
  total_ant: string | null;
  vencida_ant: string | null;
  al_dia_ant: string | null;
  recuperado_ant: string | null;
}

export const getResumen = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      WITH cortes AS (
        SELECT DISTINCT fecha_corte
          FROM cartera.cartera
         ORDER BY fecha_corte DESC
         LIMIT 2
      ),
      actual    AS (SELECT fecha_corte FROM cortes LIMIT 1),
      anterior  AS (SELECT fecha_corte FROM cortes OFFSET 1 LIMIT 1),
      stats_actual AS (
        SELECT
          SUM(saldo_total)                                       AS total,
          SUM(saldo_total) FILTER (WHERE calificacion <> 'A')    AS vencida,
          SUM(saldo_total) FILTER (WHERE calificacion = 'A')     AS al_dia
        FROM cartera.cartera
        WHERE fecha_corte = (SELECT fecha_corte FROM actual)
      ),
      stats_anterior AS (
        SELECT
          SUM(saldo_total)                                       AS total,
          SUM(saldo_total) FILTER (WHERE calificacion <> 'A')    AS vencida,
          SUM(saldo_total) FILTER (WHERE calificacion = 'A')     AS al_dia
        FROM cartera.cartera
        WHERE fecha_corte = (SELECT fecha_corte FROM anterior)
      ),
      recuperado AS (
        SELECT COALESCE(SUM(valor_pagado), 0) AS recuperado_mes
          FROM cartera.pagos
         WHERE DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)
      ),
      recuperado_anterior AS (
        SELECT COALESCE(SUM(valor_pagado), 0) AS recuperado_mes
          FROM cartera.pagos
         WHERE DATE_TRUNC('month', fecha_pago)
               = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      )
      SELECT
        a.total, a.vencida, a.al_dia,
        r.recuperado_mes,
        p.total          AS total_ant,
        p.vencida        AS vencida_ant,
        p.al_dia         AS al_dia_ant,
        ra.recuperado_mes AS recuperado_ant
      FROM stats_actual a, stats_anterior p, recuperado r, recuperado_anterior ra
    `;

    const { rows } = await query<ResumenRow>(sql);
    const row =
      rows[0] ??
      ({
        total: null,
        vencida: null,
        al_dia: null,
        recuperado_mes: null,
        total_ant: null,
        vencida_ant: null,
        al_dia_ant: null,
        recuperado_ant: null,
      } as ResumenRow);

    const total = numOrZero(row.total);
    const vencida = numOrZero(row.vencida);
    const alDia = numOrZero(row.al_dia);
    const recuperadoMes = numOrZero(row.recuperado_mes);
    const totalAnt = numOrZero(row.total_ant);
    const vencidaAnt = numOrZero(row.vencida_ant);
    const alDiaAnt = numOrZero(row.al_dia_ant);
    const recuperadoAnt = numOrZero(row.recuperado_ant);

    res.json({
      success: true,
      data: {
        total: Math.round(total),
        vencida: Math.round(vencida),
        alDia: Math.round(alDia),
        recuperadoMes: Math.round(recuperadoMes),
        tendencias: {
          total: tendenciaPct(total, totalAnt),
          vencida: tendenciaPct(vencida, vencidaAnt),
          alDia: tendenciaPct(alDia, alDiaAnt),
          recuperadoMes: tendenciaPct(recuperadoMes, recuperadoAnt),
        },
        ultimaActualizacion: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// Endpoint 2 — GET /api/cartera/clientes
// =================================================================

export const listClientes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fechaCorte = await getLatestCorte();
    const filters = readClientesFilters(req.query);
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const { whereSql, params } = buildClientesWhere(filters, fechaCorte);

    params.push(limit);
    params.push(offset);

    const orderCol = SORT_COLS[filters.sortBy];
    const sql = `
      SELECT
        cl.id_cliente,
        TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS nombre,
        c.saldo_total          AS deuda_total,
        c.dias_mora,
        c.calificacion,
        c.fecha_ultimo_pago    AS ultimo_pago,
        cr.estado              AS estado_credito,
        COUNT(*) OVER()        AS total_count
      FROM cartera.cartera c
      JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      WHERE ${whereSql}
      ORDER BY ${orderCol} ${filters.sortDir} NULLS LAST
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await query<ClienteListRow>(sql, params);
    const total = rows[0] ? Number(rows[0].total_count) : 0;
    const data = rows.map(mapClienteListRow);

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
// Endpoint 3 — GET /api/cartera/clientes/:id
// =================================================================

interface ClienteDetalleRow {
  id_cliente: string;
  primer_nombre: string | null;
  primer_apellido: string | null;
  razon_social: string | null;
  numero_documento: string | null;
  email: string | null;
  telefono_celular: string | null;
  fecha_vinculacion: Date | string | null;
  saldo_total: string | null;
  dias_mora: string | number | null;
  cuotas_mora: string | number | null;
  calificacion: string | null;
  fecha_ultimo_pago: Date | string | null;
  estado_juridico: string | null;
  estado_credito: string;
  tipo_credito: string;
  monto_desembolsado: string | null;
  fecha_desembolso: Date | string | null;
  id_credito: string;
}

interface PagoRow {
  fecha_pago: Date | string | null;
  valor_pagado: string | null;
}

interface GestionRow {
  id: number;
  autor: string | null;
  fecha: Date | string | null;
  texto: string | null;
}

const fetchClienteDetalle = async (idPrefix: string): Promise<ClienteDetalleRow | null> => {
  const sql = `
    SELECT
      cl.id_cliente,
      cl.primer_nombre,
      cl.primer_apellido,
      cl.razon_social,
      cl.numero_documento,
      cl.email,
      cl.telefono_celular,
      cl.fecha_vinculacion,
      c.saldo_total,
      c.dias_mora,
      c.cuotas_mora,
      c.calificacion,
      c.fecha_ultimo_pago,
      c.estado_juridico,
      cr.estado AS estado_credito,
      cr.tipo_credito,
      cr.monto_desembolsado,
      cr.fecha_desembolso,
      cr.id_credito
    FROM cartera.clientes cl
    JOIN cartera.creditos cr ON cr.id_cliente = cl.id_cliente
    LEFT JOIN cartera.cartera c
           ON c.id_credito = cr.id_credito
          AND c.fecha_corte = (SELECT MAX(fecha_corte) FROM cartera.cartera)
    WHERE cl.id_cliente::text ILIKE $1
    ORDER BY cr.fecha_desembolso DESC NULLS LAST
    LIMIT 1
  `;
  const { rows } = await query<ClienteDetalleRow>(sql, [`${idPrefix}%`]);
  return rows[0] ?? null;
};

export const getCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefix = parseClienteIdParam(req.params.id);
    const cliente = await fetchClienteDetalle(prefix);
    if (!cliente) throw notFound('Cliente no encontrado');

    const { rows: pagos } = await query<PagoRow>(
      `SELECT fecha_pago, valor_pagado
         FROM cartera.pagos
        WHERE id_credito = $1
        ORDER BY fecha_pago DESC
        LIMIT 5`,
      [cliente.id_credito],
    );

    const { rows: gestiones } = await query<GestionRow>(
      `SELECT id, canal AS autor, created_at AS fecha, notas AS texto
         FROM cartera.mcp_gestiones
        WHERE id_credito = $1
        ORDER BY created_at DESC`,
      [cliente.id_credito],
    );

    const nombre =
      `${cliente.primer_nombre ?? ''} ${cliente.primer_apellido ?? ''}`.trim() ||
      cliente.razon_social ||
      'Sin nombre';
    const diasMora = numOrZero(cliente.dias_mora);

    res.json({
      success: true,
      data: {
        id: formatClienteId(cliente.id_cliente),
        nombre,
        email: cliente.email ?? null,
        telefono: cliente.telefono_celular ?? null,
        fechaVinculacion: fmtYmd(cliente.fecha_vinculacion),
        deudaTotal: Math.round(numOrZero(cliente.saldo_total)),
        diasMora,
        ultimoPago: fmtYmd(cliente.fecha_ultimo_pago),
        riesgo: getRiesgo(cliente.calificacion),
        estado: getEstado(cliente.estado_credito),
        comportamientoPago: getComportamientoDetalle(diasMora),
        ultimosPagos: pagos.map((p) => ({
          fecha: fmtYmd(p.fecha_pago) ?? '',
          monto: Math.round(numOrZero(p.valor_pagado)),
        })),
        productos: [
          {
            tipo: getTipoProducto(cliente.tipo_credito),
            monto: Math.round(numOrZero(cliente.monto_desembolsado)),
          },
        ],
        estrategia:
          cliente.estado_credito === 'EN_MORA'
            ? {
                tipo: 'Recuperación',
                resumen: getEstrategiaResumenCorto(diasMora),
              }
            : null,
        notas: gestiones.map((g) => ({
          id: g.id,
          autor: g.autor ?? 'Sistema',
          fecha: fmtYmd(g.fecha) ?? '',
          texto: g.texto ?? '',
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// Endpoint 4 — POST /api/cartera/clientes/:id/notas
// =================================================================

export const createNota = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefix = parseClienteIdParam(req.params.id);

    const texto = typeof req.body?.texto === 'string' ? req.body.texto.trim() : '';
    if (!texto) throw badRequest('texto es requerido');

    // Resuelve el id_credito asociado al cliente. Si tiene varios, toma el
    // más reciente — mismo criterio que el GET detalle.
    const { rows: creditoRows } = await query<{ id_credito: string }>(
      `SELECT cr.id_credito
         FROM cartera.creditos cr
         JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
        WHERE cl.id_cliente::text ILIKE $1
        ORDER BY cr.fecha_desembolso DESC NULLS LAST
        LIMIT 1`,
      [`${prefix}%`],
    );
    if (creditoRows.length === 0) throw notFound('Cliente no encontrado');
    const idCredito = creditoRows[0].id_credito;

    const { rows: inserted } = await query<{ id: number; created_at: Date | string }>(
      `INSERT INTO cartera.mcp_gestiones (id_credito, canal, resultado, notas, created_at)
       VALUES ($1, 'sistema', 'enviado', $2, NOW())
       RETURNING id, created_at`,
      [idCredito, texto],
    );

    const row = inserted[0];
    const autor = req.user?.name ?? 'Sistema';

    res.status(201).json({
      success: true,
      data: {
        id: row.id,
        autor,
        fecha: fmtYmd(row.created_at) ?? '',
        texto,
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// Endpoint 5 — POST /api/cartera/clientes/:id/estrategia
// =================================================================

export const generarEstrategiaCliente = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const prefix = parseClienteIdParam(req.params.id);
    const cliente = await fetchClienteDetalle(prefix);
    if (!cliente) throw notFound('Cliente no encontrado');

    const diasMora = numOrZero(cliente.dias_mora);
    const cuotasMora = numOrZero(cliente.cuotas_mora);
    const saldoTotal = numOrZero(cliente.saldo_total);

    let resumen: string;
    if (diasMora > 120) {
      resumen =
        `Escalar a cobro jurídico. Saldo vencido $${formatCOP(saldoTotal)}. ` +
        `Contacto inmediato por abogado asignado.`;
    } else if (diasMora > 30) {
      resumen =
        `Llamada prioritaria + propuesta de reestructuración. ${cuotasMora} cuotas vencidas.`;
    } else if (diasMora > 0) {
      resumen = `WhatsApp empático + recordatorio de pago. Primera mora de ${diasMora} días.`;
    } else {
      const producto = sugerirProductoCrossSell(cliente.tipo_credito);
      resumen = `Cliente puntual. Ofrecer producto de ${producto} con condiciones preferenciales.`;
    }

    res.json({
      success: true,
      data: {
        tipo: diasMora > 0 ? 'Recuperación' : 'Perfilamiento',
        resumen,
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// Endpoint 6 — GET /api/cartera/exportar
// =================================================================

const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const exportarClientes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fechaCorte = await getLatestCorte();
    const filters = readClientesFilters(req.query);
    const { whereSql, params } = buildClientesWhere(filters, fechaCorte);

    const orderCol = SORT_COLS[filters.sortBy];
    const sql = `
      SELECT
        cl.id_cliente,
        TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS nombre,
        c.saldo_total          AS deuda_total,
        c.dias_mora,
        c.calificacion,
        c.fecha_ultimo_pago    AS ultimo_pago,
        cr.estado              AS estado_credito,
        0                      AS total_count
      FROM cartera.cartera c
      JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      WHERE ${whereSql}
      ORDER BY ${orderCol} ${filters.sortDir} NULLS LAST
    `;

    const { rows } = await query<ClienteListRow>(sql, params);
    const items = rows.map(mapClienteListRow);

    const headers = [
      'ID',
      'Nombre',
      'Deuda Total',
      'Días Mora',
      'Último Pago',
      'Riesgo',
      'Estado',
    ];
    const lines = [
      headers.join(','),
      ...items.map((r) =>
        [
          csvEscape(r.id),
          csvEscape(r.nombre),
          r.deudaTotal,
          r.diasMora,
          csvEscape(r.ultimoPago ?? ''),
          csvEscape(r.riesgo),
          csvEscape(r.estado),
        ].join(','),
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cartera.csv"');
    // BOM (U+FEFF) para que Excel detecte UTF-8 con tildes correctamente.
    res.send(`﻿${lines.join('\n')}`);
  } catch (err) {
    next(err);
  }
};
