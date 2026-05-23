import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpError';

interface PgErrorLike {
  code?: string;
  detail?: string;
  constraint?: string;
}

const PG_ERROR_MAP: Record<string, { status: number; code: string; message: string }> = {
  '23505': { status: 409, code: 'CONFLICT', message: 'El registro ya existe' },
  '23503': { status: 409, code: 'FK_VIOLATION', message: 'Referencia inválida a otro registro' },
  '23502': { status: 400, code: 'NULL_VIOLATION', message: 'Falta un campo obligatorio' },
  '22P02': { status: 400, code: 'INVALID_INPUT', message: 'Formato de dato inválido' },
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const isProd = process.env.NODE_ENV === 'production';

  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  const pgErr = err as PgErrorLike;
  if (pgErr?.code && PG_ERROR_MAP[pgErr.code]) {
    const mapped = PG_ERROR_MAP[pgErr.code];
    res.status(mapped.status).json({
      success: false,
      error: {
        code: mapped.code,
        message: mapped.message,
        ...(isProd ? {} : { detail: pgErr.detail }),
      },
    });
    return;
  }

  const error = err as Error;
  console.error('[errorHandler]', error?.stack || error);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'Error interno del servidor' : error?.message || 'Internal Server Error',
    },
  });
};
