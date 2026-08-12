import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type { Request, Response } from 'express';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { validatePlate } from '../services/ai.service';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

async function savePhoto(file: Express.Multer.File): Promise<string> {
  await mkdir(config.uploadsDir, { recursive: true });
  const filename = `${randomUUID()}${EXT_BY_MIME[file.mimetype] ?? '.bin'}`;
  await writeFile(path.join(config.uploadsDir, filename), file.buffer);
  return `/uploads/${filename}`;
}

/**
 * POST /api/meals/validate
 * Recibe la foto del plato cocinado, la valida contra la receta vía el
 * microservicio de IA y, si es válida, crea el MealLog e incrementa
 * el streak del usuario en +1.
 */
export async function validateMeal(req: Request, res: Response): Promise<void> {
  const { recipeId } = req.body as { recipeId?: string };
  const userId = req.user?.id ?? (req.body as { userId?: string }).userId;

  if (!userId || !recipeId) {
    res.status(400).json({ error: 'recipeId es requerido' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'Se requiere la foto del plato (imagen)' });
    return;
  }

  // Verificación de existencia — WHERE explícito, sin include ni JOIN implícito
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) {
    res.status(404).json({ error: 'Receta no encontrada' });
    return;
  }

  // Validación visual en el microservicio de IA (foto + ingredientes esperados)
  const validation = await validatePlate(req.file, recipe.ingredients);

  if (!validation.is_valid) {
    res.status(422).json({
      is_valid: false,
      message: 'El plato no corresponde a la receta. Intenta de nuevo.',
    });
    return;
  }

  const photoUrl = await savePhoto(req.file);

  // MealLog + incremento de racha en una sola transacción — WHERE explícito
  const [mealLog, updatedUser] = await prisma.$transaction([
    prisma.mealLog.create({
      data: { userId, recipeId, photoUrl, isValid: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { streak: { increment: 1 } },
    }),
  ]);

  res.status(201).json({
    is_valid: true,
    meal_log: mealLog,
    streak: updatedUser.streak,
  });
}
