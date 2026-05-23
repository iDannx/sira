import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

import { query, pool } from '../db';
import { badRequest, notFound } from '../utils/httpError';
import { assertUuid } from '../utils/validate';

const num = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Quita el hash del número de cuenta y lo reemplaza por la máscara estándar.
const maskAccount = <T extends Record<string, unknown>>(row: T): Omit<T, 'numero_cuenta_hash'> & { cuenta: string } => {
  const { numero_cuenta_hash: _hash, ...rest } = row as T & { numero_cuenta_hash?: unknown };
  return { ...(rest as Omit<T, 'numero_cuenta_hash'>), cuenta: '****' };
};

// ---------- Instituciones ----------

export const listInstituciones = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT id_institucion, nombre, tipo, pais, entidad_reguladora,
              nivel_participacion, estado, endpoint_base_url, certificacion_fapi
         FROM openfinance.of_instituciones
        ORDER BY nombre`,
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ---------- Consentimientos ----------

export const listConsentimientos = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idCliente = assertUuid(req.query.id_cliente, 'id_cliente');
    const { rows } = await query(
      `SELECT c.id_consentimiento,
              c.id_cliente,
              c.id_tpp,
              c.id_institucion_origen,
              c.estado,
              c.proposito,
              c.canal_autorizacion,
              c.fecha_autorizacion,
              c.fecha_expiracion,
              c.transaction_id,
              COALESCE(array_agg(p.tipo_permiso) FILTER (WHERE p.tipo_permiso IS NOT NULL), '{}') AS permisos
         FROM openfinance.of_consentimientos c
         LEFT JOIN openfinance.of_consentimientos_permisos p
           ON p.id_consentimiento = c.id_consentimiento
        WHERE c.id_cliente = $1
          AND c.estado = 'ACTIVO'
        GROUP BY c.id_consentimiento
        ORDER BY c.fecha_autorizacion DESC NULLS LAST`,
      [idCliente],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const MAX_CONSENT_DAYS = 365;

export const createConsentimiento = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const client = await pool.connect();
  try {
    const body = req.body ?? {};
    const idCliente = assertUuid(body.id_cliente, 'id_cliente');
    const idTpp = typeof body.id_tpp === 'string' ? body.id_tpp : null;
    const idInstitucionOrigen =
      typeof body.id_institucion_origen === 'string' ? body.id_institucion_origen : null;
    const proposito = typeof body.proposito === 'string' ? body.proposito : null;
    const canalAutorizacion =
      typeof body.canal_autorizacion === 'string' ? body.canal_autorizacion : null;
    const fechaExpiracion = body.fecha_expiracion;
    const permisos = Array.isArray(body.permisos) ? body.permisos : [];

    if (!idTpp) throw badRequest('id_tpp es requerido');
    if (!idInstitucionOrigen) throw badRequest('id_institucion_origen es requerido');
    if (typeof fechaExpiracion !== 'string') {
      throw badRequest('fecha_expiracion es requerida (YYYY-MM-DD)');
    }

    const exp = new Date(fechaExpiracion);
    if (Number.isNaN(exp.getTime())) throw badRequest('fecha_expiracion inválida');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_CONSENT_DAYS);
    if (exp < today) throw badRequest('fecha_expiracion no puede ser pasada');
    if (exp > maxDate) {
      throw badRequest(`fecha_expiracion no puede superar ${MAX_CONSENT_DAYS} días desde hoy`);
    }

    // Verifica que el cliente exista en cartera.clientes
    const { rows: clientes } = await client.query(
      `SELECT 1 FROM cartera.clientes WHERE id_cliente = $1`,
      [idCliente],
    );
    if (clientes.length === 0) throw notFound('Cliente no encontrado en cartera.clientes');

    const transactionId = randomUUID();

    await client.query('BEGIN');

    const { rows: inserted } = await client.query(
      `INSERT INTO openfinance.of_consentimientos
         (id_consentimiento, id_cliente, id_tpp, id_institucion_origen, estado,
          proposito, canal_autorizacion, fecha_autorizacion, fecha_expiracion, transaction_id)
       VALUES ($1, $2, $3, $4, 'ACTIVO', $5, $6, NOW(), $7, $8)
       RETURNING *`,
      [
        randomUUID(),
        idCliente,
        idTpp,
        idInstitucionOrigen,
        proposito,
        canalAutorizacion,
        fechaExpiracion,
        transactionId,
      ],
    );

    const consentimiento = inserted[0];
    const idConsentimiento = consentimiento.id_consentimiento;

    for (const permiso of permisos) {
      const tipo = typeof permiso === 'string' ? permiso : permiso?.tipo_permiso;
      const recurso = typeof permiso === 'string' ? null : permiso?.recurso_especifico ?? null;
      if (!tipo) continue;
      await client.query(
        `INSERT INTO openfinance.of_consentimientos_permisos
           (id_consentimiento, tipo_permiso, recurso_especifico)
         VALUES ($1, $2, $3)`,
        [idConsentimiento, tipo, recurso],
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: { ...consentimiento, permisos },
    });
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

export const revokeConsentimiento = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = assertUuid(req.params.id, 'id');
    const { rows } = await query(
      `UPDATE openfinance.of_consentimientos
          SET estado = 'REVOCADO'
        WHERE id_consentimiento = $1
        RETURNING *`,
      [id],
    );
    if (rows.length === 0) throw notFound('Consentimiento no encontrado');
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

// ---------- Perfil financiero consolidado ----------

export const getPerfil = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idCliente = assertUuid(req.params.id_cliente, 'id_cliente');

    const { rows: externo } = await query(
      `SELECT id_cliente,
              ingresos_verificados,
              egresos_verificados,
              activos_externos,
              pasivos_externos,
              saldo_promedio_cuentas,
              num_instituciones_activas,
              score_comportamiento_pago,
              capacidad_endeudamiento
         FROM openfinance.of_perfil_financiero
        WHERE id_cliente = $1`,
      [idCliente],
    );

    const { rows: internoRows } = await query(
      `SELECT cl.id_cliente,
              cl.primer_nombre,
              cl.primer_apellido,
              cl.razon_social,
              cl.ingresos_mensuales,
              cl.estado
         FROM cartera.clientes cl
        WHERE cl.id_cliente = $1`,
      [idCliente],
    );

    if (internoRows.length === 0) throw notFound('Cliente no encontrado');

    res.json({
      success: true,
      data: {
        cliente: internoRows[0],
        perfilExterno: externo[0] ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------- Cuentas externas ----------

export const getCuentas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idCliente = assertUuid(req.params.id_cliente, 'id_cliente');

    const { rows } = await query<Record<string, unknown>>(
      `SELECT ce.id_cuenta_ext,
              ce.id_cliente,
              ce.id_consentimiento,
              ce.id_institucion,
              ce.numero_cuenta_hash,
              ce.tipo_cuenta,
              ce.estado,
              ce.fecha_apertura,
              s.saldo_disponible,
              s.saldo_bloqueado,
              s.saldo_total,
              s.fecha_saldo,
              i.nombre AS nombre_institucion
         FROM openfinance.of_cuentas_externas ce
         JOIN openfinance.of_instituciones i ON i.id_institucion = ce.id_institucion
         LEFT JOIN openfinance.of_cuentas_externas_saldos s
                ON s.id_cuenta_ext = ce.id_cuenta_ext
               AND s.fecha_saldo = (
                 SELECT MAX(s2.fecha_saldo)
                   FROM openfinance.of_cuentas_externas_saldos s2
                  WHERE s2.id_cuenta_ext = ce.id_cuenta_ext
               )
        WHERE ce.id_cliente = $1
        ORDER BY i.nombre`,
      [idCliente],
    );

    res.json({
      success: true,
      data: rows.map((r) => maskAccount(r)),
    });
  } catch (err) {
    next(err);
  }
};

// ---------- Propuestas y ofertas ----------

export const listPropuestas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idCliente = assertUuid(req.query.id_cliente, 'id_cliente');

    const { rows: propuestas } = await query<Record<string, unknown> & { id_propuesta: string }>(
      `SELECT *
         FROM openfinance.of_propuestas_credito
        WHERE id_cliente = $1
        ORDER BY id_propuesta DESC`,
      [idCliente],
    );

    if (propuestas.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const ids = propuestas.map((p) => p.id_propuesta);
    const { rows: ofertas } = await query<Record<string, unknown> & { id_propuesta: string }>(
      `SELECT *
         FROM openfinance.of_propuestas_ofertas
        WHERE id_propuesta = ANY($1::uuid[])`,
      [ids],
    );

    const ofertasByPropuesta = new Map<string, Record<string, unknown>[]>();
    for (const o of ofertas) {
      const arr = ofertasByPropuesta.get(o.id_propuesta) ?? [];
      arr.push(o);
      ofertasByPropuesta.set(o.id_propuesta, arr);
    }

    const data = propuestas.map((p) => ({
      ...p,
      ofertas: ofertasByPropuesta.get(p.id_propuesta) ?? [],
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const createPropuesta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body ?? {};
    const idCliente = assertUuid(body.id_cliente, 'id_cliente');
    const idConsentimiento = assertUuid(body.id_consentimiento, 'id_consentimiento');
    const tipoCredito = typeof body.tipo_credito_solicitado === 'string'
      ? body.tipo_credito_solicitado
      : null;
    const monto = Number(body.monto_solicitado);
    const plazo = Number(body.plazo_solicitado_meses);

    if (!tipoCredito) throw badRequest('tipo_credito_solicitado es requerido');
    if (!Number.isFinite(monto) || monto <= 0) {
      throw badRequest('monto_solicitado debe ser mayor a 0');
    }
    if (!Number.isFinite(plazo) || plazo <= 0) {
      throw badRequest('plazo_solicitado_meses debe ser mayor a 0');
    }

    const { rows } = await query(
      `INSERT INTO openfinance.of_propuestas_credito
         (id_propuesta, id_cliente, id_consentimiento,
          tipo_credito_solicitado, monto_solicitado, plazo_solicitado_meses, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'BORRADOR')
       RETURNING *`,
      [randomUUID(), idCliente, idConsentimiento, tipoCredito, monto, Math.trunc(plazo)],
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

export const aceptarPropuesta = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const client = await pool.connect();
  try {
    const idPropuesta = assertUuid(req.params.id, 'id');
    const idOferta = assertUuid(req.body?.id_oferta, 'id_oferta');

    await client.query('BEGIN');

    const { rows: ofertaRows } = await client.query(
      `SELECT id_propuesta
         FROM openfinance.of_propuestas_ofertas
        WHERE id_oferta = $1
        FOR UPDATE`,
      [idOferta],
    );
    if (ofertaRows.length === 0) throw notFound('Oferta no encontrada');
    if (ofertaRows[0].id_propuesta !== idPropuesta) {
      throw badRequest('La oferta no pertenece a la propuesta indicada');
    }

    await client.query(
      `UPDATE openfinance.of_propuestas_ofertas
          SET estado = CASE WHEN id_oferta = $1 THEN 'ACEPTADA' ELSE 'RECHAZADA' END
        WHERE id_propuesta = $2`,
      [idOferta, idPropuesta],
    );

    const { rows: propuesta } = await client.query(
      `UPDATE openfinance.of_propuestas_credito
          SET estado = 'ACEPTADA'
        WHERE id_propuesta = $1
        RETURNING *`,
      [idPropuesta],
    );
    if (propuesta.length === 0) throw notFound('Propuesta no encontrada');

    const { rows: ofertasFinal } = await client.query(
      `SELECT * FROM openfinance.of_propuestas_ofertas WHERE id_propuesta = $1`,
      [idPropuesta],
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { ...propuesta[0], ofertas: ofertasFinal },
    });
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

// ---------- Inversiones, seguros, pagos iniciados ----------

export const getInversiones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idCliente = assertUuid(req.params.id_cliente, 'id_cliente');
    const { rows } = await query(
      `SELECT inv.*, i.nombre AS nombre_institucion
         FROM openfinance.of_inversiones inv
         JOIN openfinance.of_instituciones i ON i.id_institucion = inv.id_institucion
        WHERE inv.id_cliente = $1
          AND inv.estado = 'ACTIVO'
        ORDER BY inv.valor_mercado DESC NULLS LAST`,
      [idCliente],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const getSeguros = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idCliente = assertUuid(req.params.id_cliente, 'id_cliente');
    const { rows } = await query(
      `SELECT seg.*, i.nombre AS nombre_institucion
         FROM openfinance.of_seguros seg
         JOIN openfinance.of_instituciones i ON i.id_institucion = seg.id_institucion
        WHERE seg.id_cliente = $1
          AND seg.estado = 'ACTIVO'
        ORDER BY seg.fecha_inicio DESC NULLS LAST`,
      [idCliente],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

export const getPagosIniciados = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idCliente = assertUuid(req.params.id_cliente, 'id_cliente');
    const { rows } = await query(
      `SELECT pi.*,
              cr.numero_credito,
              i.nombre AS nombre_tpp
         FROM openfinance.of_pagos_iniciados pi
         LEFT JOIN cartera.creditos cr ON cr.id_credito = pi.id_credito
         JOIN openfinance.of_tpp t ON t.id_tpp = pi.id_tpp
         JOIN openfinance.of_instituciones i ON i.id_institucion = t.id_institucion
        WHERE pi.id_cliente = $1`,
      [idCliente],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
