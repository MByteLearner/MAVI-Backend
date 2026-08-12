import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { AuthUserPayload } from '../types/express';

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (_error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}
