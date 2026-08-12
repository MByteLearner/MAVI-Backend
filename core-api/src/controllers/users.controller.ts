import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * GET /api/users/profile
 * Obtiene el perfil del usuario autenticado actual.
 * Cumple la regla estricta: WHERE id = req.user.id
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
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

/**
 * PUT /api/users/profile
 * Actualiza el perfil del usuario autenticado (nombre, objetivos, alergias).
 * Cumple la regla estricta: WHERE id = req.user.id
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const { name, goals, allergies } = req.body as {
    name?: string;
    goals?: string[];
    allergies?: string[];
  };

  // Verificación explícita de existencia antes de actualizar — WHERE id = ?
  const existingUser = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!existingUser) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  // Actualización explícita sobre la id del usuario — WHERE id = ?
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name !== undefined && { name }),
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
      guideline: true,
    },
  });

  res.json({
    message: 'Perfil actualizado exitosamente',
    user: updatedUser,
  });
}
