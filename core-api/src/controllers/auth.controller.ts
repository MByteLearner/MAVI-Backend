import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';

function generateToken(id: string, email: string): string {
  const options: jwt.SignOptions = {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign({ id, email }, config.jwtSecret, options);
}

/**
 * POST /api/auth/register
 * Registra un nuevo usuario con email y contraseña.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name, goals, allergies } = req.body as {
    email?: string;
    password?: string;
    name?: string;
    goals?: string[];
    allergies?: string[];
  };

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      ...(Array.isArray(goals) && { goals }),
      ...(Array.isArray(allergies) && { allergies }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      goals: true,
      allergies: true,
      streak: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id, user.email);

  res.status(201).json({
    user,
    token,
  });
}

/**
 * POST /api/auth/login
 * Inicia sesión validando las credenciales.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const token = generateToken(user.id, user.email);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      goals: user.goals,
      allergies: user.allergies,
      streak: user.streak,
      createdAt: user.createdAt,
    },
    token,
  });
}

/**
 * GET /api/auth/me
 * Retorna la información del usuario autenticado actual.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      goals: true,
      allergies: true,
      streak: true,
      createdAt: true,
      guideline: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  res.json({ user });
}
