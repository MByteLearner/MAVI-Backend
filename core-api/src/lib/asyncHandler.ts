import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/** Envuelve handlers async para propagar errores al middleware de error (Express 4). */
export const asyncHandler =
  (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
