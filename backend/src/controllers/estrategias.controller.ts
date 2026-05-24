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
  score_comportamiento_pago: string | number | null;
  capacidad_endeudamiento: string | null;
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

const computeAfinidad = (
  scoreComportamiento: number | null,
  calificacion: string,
  diasMora: number,
  capacidadEndeudamiento: number,
): number => {
  let score = 60;
  if (scoreComportamiento !== null && scoreComportamiento > 0) {
    score = Math.round(scoreComportamiento / 10);
  } else {
    if (calificacion === 'A') score += 20;
    if (diasMora === 0) score += 10;
    if (capacidadEndeudamiento > 2_000_000) score += 10;
  }
  return Math.min(100, Math.max(0, score));
};

const toNivelAfinidad = (afinidad: number): NivelAfinidad => {
  if (afinidad >= 75) return 'Alto';
  if (afinidad >= 50) return 'Medio';
  return 'Bajo';
};

const buildPerfilDesc = (
  scoreComportamiento: number | null,
  saldoTotal: number,
  capacidadEndeudamiento: number,
  plazoMeses: number,
): string => {
  if (scoreComportamiento !== null && scoreComportamiento > 0) {
    // % de la capacidad de endeudamiento ya comprometida con el saldo vigente.
    const pct =
      capacidadEndeudamiento > 0
        ? Math.min(100, Math.round((saldoTotal / capacidadEndeudamiento) * 100))
        : 0;
    return `Score ${scoreComportamiento} · Endeudamiento ${pct}%`;
  }
  return `Calificación A · ${plazoMeses} meses sin mora`;
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

    // El schema `openfinance` fue eliminado: ya no hay LEFT JOIN a
    // `of_perfil_financiero`. Devolvemos NULL en las columnas que venían de
    // ahí para preservar la forma de PerfilamientoRow; el mapeo JS cae al
    // ramal "sin datos OF" de manera natural.
    const sql = `
      SELECT
        cl.id_cliente,
        cr.id_credito,
        TRIM(COALESCE(cl.primer_nombre, '') || ' ' || COALESCE(cl.primer_apellido, '')) AS nombre,
        cr.tipo_credito,
        cr.plazo_meses,
        cr.monto_desembolsado,
        cr.tasa_interes_ea,
        c.calificacion,
        c.dias_mora,
        c.saldo_total,
        NULL::numeric AS score_comportamiento_pago,
        NULL::numeric AS capacidad_endeudamiento
      FROM cartera.cartera c
      JOIN cartera.creditos cr ON cr.id_credito = c.id_credito
      JOIN cartera.clientes cl ON cl.id_cliente = cr.id_cliente
      WHERE ${where.join(' AND ')}
      ORDER BY c.saldo_total DESC NULLS LAST
      LIMIT 50
    `;

    const { rows } = await query<PerfilamientoRow>(sql, params);

    let data = rows.map((row, i) => {
      const tipoCredito = row.tipo_credito ?? 'CONSUMO';
      const saldoTotal = num(row.saldo_total);
      const score =
        row.score_comportamiento_pago !== null && row.score_comportamiento_pago !== undefined
          ? num(row.score_comportamiento_pago)
          : null;
      const capacidad = num(row.capacidad_endeudamiento);
      const diasMora = num(row.dias_mora);
      const plazoMeses = num(row.plazo_meses);

      const producto = productoSugerido(tipoCredito, saldoTotal, capacidad);
      const afinidad = computeAfinidad(score, row.calificacion, diasMora, capacidad);
      const nivelAfinidad = toNivelAfinidad(afinidad);
      const perfil = buildPerfilDesc(score, saldoTotal, capacidad, plazoMeses);

      // Sin schema openfinance, `capacidad` suele ser 0. Solo agregamos esa
      // línea cuando tenemos un valor real para evitar "$0" en el texto.
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

    if (nivelFilter && (NIVELES_RIESGO as readonly string[]).includes(nivelFilter)) {
      data = data.filter((d) => d.nivelRiesgo === nivelFilter);
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
