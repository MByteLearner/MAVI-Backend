import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface SuggestedRecipe {
  id: string;
  name: string;
  ingredients: unknown;
  base_calories: number;
}

/**
 * GET /api/recipes?userId=<uuid>
 * Retorna recetas sugeridas cruzando los ingredientes de cada receta
 * contra la guía médica del usuario, usando ÚNICAMENTE cláusulas WHERE
 * explícitas (sin include ni JOIN implícitos).
 */
export async function getSuggestedRecipes(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id ?? (req.query.userId as string | undefined);

  if (!userId) {
    res.status(400).json({ error: 'El parámetro userId es requerido' });
    return;
  }

  // 1) Guía médica del usuario — WHERE explícito
  const guideline = await prisma.medicalGuideline.findUnique({ where: { userId } });
  if (!guideline) {
    res.status(404).json({ error: 'El usuario no tiene una guía médica registrada' });
    return;
  }

  // 2) Cruce receta ↔ reglas médicas — WHERE explícito en SQL crudo:
  //    a) TODOS los ingredientes de la receta deben estar contenidos en allowed_ingredients (<@ jsonb)
  //    b) NINGÚN ingrediente de la receta puede existir en restrictions (?| text[])
  const conditions: Prisma.Sql[] = [];

  if (guideline.allowedIngredients.length > 0) {
    conditions.push(
      Prisma.sql`ingredients::jsonb <@ ${JSON.stringify(guideline.allowedIngredients)}::jsonb`,
    );
  }

  if (guideline.restrictions.length > 0) {
    conditions.push(
      Prisma.sql`NOT (ingredients::jsonb ?| ${guideline.restrictions}::text[])`,
    );
  }

  const whereClause =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

  const recipes = await prisma.$queryRaw<SuggestedRecipe[]>`
    SELECT id, name, ingredients, base_calories
    FROM recipes
    ${whereClause}
    ORDER BY name ASC
  `;

  res.json(recipes);
}
