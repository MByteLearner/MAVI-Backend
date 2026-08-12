import type { User } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
