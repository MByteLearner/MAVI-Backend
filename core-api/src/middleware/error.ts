import axios from 'axios';
import type { NextFunction, Request, Response } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Falla en la comunicación con el microservicio de IA
  if (axios.isAxiosError(err)) {
    console.error('[AI Service Error]', err.message);
    res.status(502).json({ error: 'El servicio de IA no está disponible' });
    return;
  }

  console.error('[Internal Error]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
