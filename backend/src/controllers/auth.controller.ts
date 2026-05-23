import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

import { query } from '../db';
import { badRequest, unauthorized } from '../utils/httpError';
import { isEmail } from '../utils/validate';

interface UsuarioRow {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  role: string;
  activo: boolean;
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {};
    if (!isEmail(email)) throw badRequest('Email inválido', 'INVALID_EMAIL');
    if (typeof password !== 'string' || password.length < 6) {
      throw badRequest('La contraseña debe tener al menos 6 caracteres', 'INVALID_PASSWORD');
    }

    const { rows } = await query<UsuarioRow>(
      `SELECT id, nombre, email, password_hash, role, activo
         FROM cartera.usuarios
        WHERE email = $1`,
      [email],
    );

    const user = rows[0];
    if (!user || !user.activo) throw unauthorized('Credenciales inválidas');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw unauthorized('Credenciales inválidas');

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no configurado');

    const payload = { id: user.id, name: user.nombre, email: user.email, role: user.role };
    const options: SignOptions = { expiresIn: '8h' };
    const token = jwt.sign(payload, secret, options);

    res.json({
      success: true,
      data: {
        token,
        user: payload,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req: Request, res: Response, _next: NextFunction) => {
  res.json({ success: true, data: { message: 'Sesión cerrada' } });
};

export const me = async (req: Request, res: Response, _next: NextFunction) => {
  res.json({ success: true, data: req.user });
};
