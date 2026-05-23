import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { unauthorized } from '../utils/httpError';

export interface AuthPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(unauthorized('Falta header Authorization Bearer'));
  }
  const token = header.slice(7).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new Error('JWT_SECRET no configurado'));
  }
  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(unauthorized());
  }
};
