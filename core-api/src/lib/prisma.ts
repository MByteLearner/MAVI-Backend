import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://mavi:mavi_secret@localhost:5432/mavi';
}

export const prisma = new PrismaClient();
