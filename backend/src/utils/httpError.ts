export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg: string, code = 'BAD_REQUEST') =>
  new HttpError(400, code, msg);

export const unauthorized = (msg = 'Token inválido o expirado') =>
  new HttpError(401, 'UNAUTHORIZED', msg);

export const forbidden = (msg = 'Acción no permitida') =>
  new HttpError(403, 'FORBIDDEN', msg);

export const notFound = (msg = 'Recurso no encontrado') =>
  new HttpError(404, 'NOT_FOUND', msg);

export const conflict = (msg: string) =>
  new HttpError(409, 'CONFLICT', msg);
