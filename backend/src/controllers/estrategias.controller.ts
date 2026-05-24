import { Request, Response, NextFunction } from 'express';

import { query } from '../db';
import { badRequest } from '../utils/httpError';
import { assertUuid, parsePagination } from '../utils/validate';
import { getLatestCorte } from '../utils/carteraCache';

const formatCOP = (n: number): string =>
  new Intl.NumberFormat('es-CO').format(Math.round(n));

const num = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const hasPaginationParams = (q: Request['query']): boolean =>
  q.page !== undefined || q.limit !== undefined;

const sliceWithMeta = <T>(
  data: T[],
  req: Request,
): { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } } => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const total = data.length;
  return {
    data: data.slice(offset, offset + limit),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

// =================================================================
// Perfilamiento — clientes calificación A sin mora reciente
// =================================================================

const NIVELES_AFINIDAD = ['Alto', 'Medio', 'Bajo'] as const;
type NivelAfinidad = (typeof NIVELES_AFINIDAD)[number];

interface PerfilamientoRow {
  id_cliente: string;
  id_credito: string;
  nombre: string | null;
  tipo_credito: string;
  plazo_meses: string | number | null;
  monto_desembolsado: string | null;
  tasa_interes_ea: string | null;
  calificacion: string;
  dias_mora: string | number | null;
  saldo_total: string | null;
  ingresos_mensuales: string | null;
  egresos_mensuales: string | null;
}

const productoSugerido = (
  tipoCredito: string,
  saldoTotal: number,
  capacidadEndeudamiento: number,
): string => {
  if (saldoTotal === 0 && tipoCredito !== 'HIPOTECARIO') return 'Compra de cartera';
  if (tipoCredito === 'MICROCREDITO') return 'Crédito de libre inversión';
  if (tipoCredito === 'CONSUMO' && capacidadEndeudamiento > 1_500_000) return 'Crédito vehículo';
  if (tipoCredito === 'HIPOTECARIO') return 'Seguro de vida hogar';
  return 'Crédito de consumo';
};

// Afinidad calculada únicamente con datos internos (cartera + clientes).
// El score base es 60; se suma por buena calificación, sin mora, capacidad
// estimada > 1M / 2M y créditos significativos (> 5M desembolsado).
const calcularAfinidad = (
  ingresos: number,
  egresos: number,
  montoDesembolsado: number,
  _plazoMeses: number,
  calificacion: string,
  diasMora: number,
): number => {
  let score = 60;
  if (calificacion === 'A') score += 15;
  if (diasMora === 0) score += 10;
  const capacidad = (ingresos - (egresos ?? 0)) * 0.3;
  if (capacidad > 2_000_000) score += 10;
  if (capacidad > 1_000_000) score += 5;
  if (montoDesembolsado > 5_000_000) score += 5;
  return Math.min(100, Math.max(0, score));
};

const toNivelAfinidad = (afinidad: number): NivelAfinidad => {
  if (afinidad >= 75) return 'Alto';
  if (afinidad >= 50) return 'Medio';
  return 'Bajo';
};

export const getPerfilamiento = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fechaCorte = await getLatestCorte();
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : null;
    const nivelFilter =
      typeof req.query.nivelAfinidad === 'string' ? req.query.nivelAfinidad : null;

    const where: string[] = [
      'c.fecha_corte = $1',
      "c.calificacion = 'A'",
      'c.dias_mora = 0',
    ];
    const params: unknown[] = [fechaCorte];

    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) ILIKE $${params.length}`,
      );
    }

    // Toda la afinidad y el perfil se derivan ahora de datos internos
    // (cartera + clientes). Incluimos `cr.id_credito` aunque el spec no lo
    // pide explícitamente, porque el frontend lo usa para llamar
    // POST /api/estrategias/:id/aplicar.
    const sql = `
      SELECT
        cl.id_cliente,
        cr.id_credito,
        TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS nombre,
        cr.tipo_credito,
        cr.monto_desembolsado,
        cr.tasa_interes_ea,
        cr.plazo_meses,
        c.calificacion,
        c.dias_mora,
        c.saldo_total,
        cl.ingresos_mensuales,
        cl.egresos_mensuales
      FROM cartera.cartera c
      JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      WHERE ${where.join(' AND ')}
      ORDER BY cl.ingresos_mensuales DESC NULLS LAST
      LIMIT 50
    `;

    const { rows } = await query<PerfilamientoRow>(sql, params);

    let data = rows.map((row, i) => {
      const tipoCredito = row.tipo_credito ?? 'CONSUMO';
      const saldoTotal = num(row.saldo_total);
      const ingresos = num(row.ingresos_mensuales);
      const egresos = num(row.egresos_mensuales);
      const montoDesembolsado = num(row.monto_desembolsado);
      const diasMora = num(row.dias_mora);
      const plazoMeses = num(row.plazo_meses);
      // Capacidad estimada como el 30% del excedente mensual (ingresos - egresos).
      const capacidad = Math.max(0, (ingresos - egresos) * 0.3);

      const producto = productoSugerido(tipoCredito, saldoTotal, capacidad);
      const afinidad = calcularAfinidad(
        ingresos,
        egresos,
        montoDesembolsado,
        plazoMeses,
        row.calificacion,
        diasMora,
      );
      const nivelAfinidad = toNivelAfinidad(afinidad);
      const perfil = `Calificación A · Ingresos $${formatCOP(ingresos)} · ${plazoMeses} meses de historial`;

      const capacidadLine =
        capacidad > 0 ? ` Capacidad de endeudamiento estimada: $${formatCOP(capacidad)}.` : '';
      const estrategia =
        `Cliente con historial de pago ejemplar en producto ${tipoCredito.toLowerCase().replace(/_/g, ' ')}.` +
        capacidadLine +
        ` Se recomienda ofrecer ${producto} con condiciones preferenciales.\n` +
        `Acción sugerida: contactar por canal preferido y presentar simulación personalizada.`;

      return {
        id: i + 1,
        idCredito: row.id_credito,
        idCliente: row.id_cliente,
        nombre: (row.nombre ?? '').trim() || 'Sin nombre',
        perfil,
        productoSugerido: producto,
        afinidad,
        nivelAfinidad,
        estrategia,
        fechaGeneracion: new Date().toISOString().split('T')[0],
      };
    });

    if (nivelFilter && (NIVELES_AFINIDAD as readonly string[]).includes(nivelFilter)) {
      data = data.filter((d) => d.nivelAfinidad === nivelFilter);
    }

    if (hasPaginationParams(req.query)) {
      const { data: page, meta } = sliceWithMeta(data, req);
      res.json({ success: true, data: page, meta });
      return;
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// Recuperación — mora activa que requiere gestión
// =================================================================

const NIVELES_RIESGO = ['Alto', 'Medio', 'Bajo'] as const;
type NivelRiesgo = (typeof NIVELES_RIESGO)[number];

interface RecuperacionRow {
  id_cliente: string;
  id_credito: string;
  nombre: string | null;
  telefono_celular: string | null;
  email: string | null;
  numero_credito: string;
  tipo_credito: string;
  calificacion: string;
  dias_mora: string | number | null;
  cuotas_mora: string | number | null;
  saldo_capital: string | null;
  saldo_total: string | null;
  saldo_mora_real: string | null;
  estado_juridico: string | null;
  promesas_previas: string | number | null;
}

const toNivelRiesgo = (calificacion: string, diasMora: number): NivelRiesgo => {
  if (calificacion === 'E' || diasMora > 120) return 'Alto';
  if (calificacion === 'C' || calificacion === 'D') return 'Medio';
  return 'Bajo';
};

const buildComportamientoPago = (
  promesasPrevias: number,
  estadoJuridico: string | null,
  cuotasMora: number,
): string => {
  if (promesasPrevias > 2) {
    return `Mora recurrente · ${promesasPrevias} acuerdos previos, cumplimiento parcial`;
  }
  if (promesasPrevias > 0) {
    return 'Mora recurrente pero negocia y cumple acuerdos';
  }
  if (estadoJuridico && estadoJuridico !== 'SIN_PROCESO') {
    return `En proceso ${estadoJuridico.toLowerCase().replace(/_/g, ' ')} · requiere abogado`;
  }
  if (cuotasMora === 1) {
    return 'Primera mora · posible olvido o dificultad puntual';
  }
  return `${cuotasMora} cuotas vencidas · sin contacto previo registrado`;
};

const accionRecomendada = (diasMora: number): string => {
  if (diasMora > 120) {
    return 'Escalar a proceso jurídico o negociar acuerdo de pago con descuento en mora';
  }
  if (diasMora > 60) {
    return 'Llamada prioritaria + propuesta de reestructuración';
  }
  return 'Enviar recordatorio WhatsApp + SMS con link de pago';
};

export const getRecuperacion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fechaCorte = await getLatestCorte();
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : null;
    const nivelFilter =
      typeof req.query.nivelRiesgo === 'string' ? req.query.nivelRiesgo : null;

    let diasMoraMin: number | null = null;
    if (req.query.diasMoraMin !== undefined) {
      const parsed = Number(req.query.diasMoraMin);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw badRequest('diasMoraMin debe ser un número >= 0', 'INVALID_FILTER');
      }
      diasMoraMin = Math.trunc(parsed);
    }

    // LIMIT/OFFSET solo si ?limit=N es explícito. Sin ese parámetro no se
    // aplica ningún tope a la query principal — devuelve todos los registros.
    let sqlLimit: number | null = null;
    let pageNum = 1;
    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        throw badRequest('limit debe ser un número > 0', 'INVALID_LIMIT');
      }
      sqlLimit = Math.trunc(parsedLimit);
      if (req.query.page !== undefined) {
        const parsedPage = Number(req.query.page);
        if (!Number.isFinite(parsedPage) || parsedPage < 1) {
          throw badRequest('page debe ser un número >= 1', 'INVALID_PAGE');
        }
        pageNum = Math.trunc(parsedPage);
      }
    }

    const where: string[] = [
      'c.fecha_corte = $1',
      "c.calificacion IN ('B','C','D','E')",
      "cr.estado = 'EN_MORA'",
    ];
    const params: unknown[] = [fechaCorte];

    if (search) {
      params.push(`%${search}%`);
      where.push(
        `(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) ILIKE $${params.length}`,
      );
    }

    if (diasMoraMin !== null) {
      params.push(diasMoraMin);
      where.push(`c.dias_mora >= $${params.length}`);
    }

    // El filtro de nivelRiesgo se traduce a condiciones SQL para que la
    // paginación y los conteos reflejen el grupo correcto. Los literales son
    // seguros porque nivelFilter sólo puede tomar 3 valores fijos (whitelist).
    if (nivelFilter === 'Alto') {
      where.push(`(c.calificacion = 'E' OR c.dias_mora > 120)`);
    } else if (nivelFilter === 'Medio') {
      where.push(`(c.calificacion IN ('C','D') AND c.dias_mora <= 120)`);
    } else if (nivelFilter === 'Bajo') {
      where.push(`(c.calificacion = 'B' AND c.dias_mora <= 30)`);
    }

    let limitOffsetClause = '';
    if (sqlLimit !== null) {
      params.push(sqlLimit);
      params.push((pageNum - 1) * sqlLimit);
      limitOffsetClause = `LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const sql = `
      SELECT
        cl.id_cliente,
        cr.id_credito,
        TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS nombre,
        cl.telefono_celular,
        cl.email,
        cr.numero_credito,
        cr.tipo_credito,
        c.calificacion,
        c.dias_mora,
        c.cuotas_mora,
        c.saldo_capital,
        c.saldo_total,
        COALESCE(mora.saldo_mora_real, 0) AS saldo_mora_real,
        c.estado_juridico,
        (
          SELECT COUNT(*)
            FROM cartera.mcp_gestiones g
           WHERE g.id_credito = cr.id_credito
             AND g.resultado = 'promesa_pago'
        ) AS promesas_previas
      FROM cartera.cartera c
      JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      LEFT JOIN (
        SELECT id_credito,
               SUM(valor_capital + valor_intereses) AS saldo_mora_real
          FROM cartera.cuotas
         WHERE estado IN ('VENCIDA', 'PAGADA_PARCIAL')
         GROUP BY id_credito
      ) mora ON mora.id_credito = cr.id_credito
      WHERE ${where.join(' AND ')}
      ORDER BY c.calificacion, c.dias_mora DESC
      ${limitOffsetClause}
    `;

    const { rows } = await query<RecuperacionRow>(sql, params);

    let data = rows.map((row, index) => {
      const diasMora = num(row.dias_mora);
      const cuotasMora = num(row.cuotas_mora);
      const saldoTotal = num(row.saldo_total);
      const saldoCapital = num(row.saldo_capital);
      const saldoMoraReal = num(row.saldo_mora_real);
      const promesasPrevias = num(row.promesas_previas);
      const nivelRiesgo = toNivelRiesgo(row.calificacion, diasMora);
      const comportamientoPago = buildComportamientoPago(
        promesasPrevias,
        row.estado_juridico,
        cuotasMora,
      );
      const accion = accionRecomendada(diasMora);

      const estrategia =
        `Cuenta con ${diasMora} días en mora. Saldo vencido: $${formatCOP(saldoTotal)}.\n` +
        `Comportamiento: ${comportamientoPago}.\n` +
        `Acción recomendada: ${accion}.`;

      return {
        id: index + 1,
        idCredito: row.id_credito,
        idCliente: row.id_cliente,
        nombre: (row.nombre ?? '').trim() || 'Sin nombre',
        telefono: row.telefono_celular ?? null,
        email: row.email ?? null,
        numeroCredito: row.numero_credito,
        tipoCredito: row.tipo_credito,
        diasMora,
        nivelRiesgo,
        comportamientoPago,
        montoVencido: Math.round(saldoTotal),
        saldoMoraReal: Math.round(saldoMoraReal),
        saldoCapital: Math.round(saldoCapital),
        estadoJuridico: row.estado_juridico,
        estrategia,
        fechaGeneracion: new Date().toISOString().split('T')[0],
      };
    });

    // El filtro de nivelRiesgo ya se aplicó en el WHERE de la query — no hace
    // falta filtrar aquí en JS.

    // Si ?limit fue explícito, la query ya vino paginada desde SQL; incluimos
    // meta con la página actual. Sin ?limit, devolvemos todos los registros
    // sin meta ni cortes adicionales.
    if (sqlLimit !== null) {
      res.json({
        success: true,
        data,
        meta: {
          total: data.length,
          page: pageNum,
          limit: sqlLimit,
          totalPages: Math.max(1, Math.ceil(data.length / sqlLimit)),
        },
      });
      return;
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// Generar — stub de regeneración asíncrona
// =================================================================

export const generar = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Regeneración iniciada',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// =================================================================
// Aplicar — registra una gestión "enviada" sobre el id_credito
// =================================================================

const TIPOS_VALIDOS = ['perfilamiento', 'recuperacion'] as const;
type TipoEstrategia = (typeof TIPOS_VALIDOS)[number];

export const aplicar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idCredito = assertUuid(req.params.id, 'id');
    const tipo = req.body?.tipo as TipoEstrategia | undefined;

    if (!tipo || !(TIPOS_VALIDOS as readonly string[]).includes(tipo)) {
      throw badRequest(
        'tipo debe ser "perfilamiento" o "recuperacion"',
        'INVALID_TIPO',
      );
    }

    const notas = `Estrategia aplicada desde módulo Estrategias (tipo: ${tipo})`;

    const { rows } = await query<{ id: number }>(
      `INSERT INTO cartera.mcp_gestiones (id_credito, canal, resultado, notas)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [idCredito, 'sistema', 'enviado', notas],
    );

    res.status(201).json({
      success: true,
      data: { id: rows[0].id, aplicada: true },
    });
  } catch (err) {
    next(err);
  }
};
