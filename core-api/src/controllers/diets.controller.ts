import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { extractDietRules } from '../services/ai.service';

/**
 * POST /api/diets/upload
 * Recibe el plan médico (PDF/imagen), lo envía al microservicio de IA
 * y persiste las reglas extraídas en MedicalGuideline.
 */
export async function uploadDiet(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id ?? (req.body.userId as string | undefined);

  if (!userId) {
    res.status(400).json({ error: 'userId es requerido' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'Se requiere un archivo (PDF o imagen)' });
    return;
  }

  // Verificación de existencia del usuario — WHERE explícito
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  // Petición HTTP interna al microservicio de IA
  const extracted = await extractDietRules(req.file);

  // Persistencia de la guía médica — WHERE explícito sobre user_id (upsert)
  const guideline = await prisma.medicalGuideline.upsert({
    where: { userId },
    update: {
      allowedIngredients: extracted.allowed_ingredients,
      restrictions: extracted.restrictions,
    },
    create: {
      userId,
      allowedIngredients: extracted.allowed_ingredients,
      restrictions: extracted.restrictions,
    },
  });

  res.status(201).json(guideline);
}
