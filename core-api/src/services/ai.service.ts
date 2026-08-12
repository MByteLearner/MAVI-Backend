import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';

export interface DietExtraction {
  allowed_ingredients: string[];
  restrictions: string[];
}

export interface PlateValidation {
  is_valid: boolean;
}

function buildFileForm(file: Express.Multer.File): FormData {
  const form = new FormData();
  form.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  return form;
}

/** Envía el plan médico (PDF/imagen) al microservicio de IA para extraer las reglas. */
export async function extractDietRules(file: Express.Multer.File): Promise<DietExtraction> {
  const form = buildFileForm(file);
  const { data } = await axios.post<DietExtraction>(
    `${config.aiServiceUrl}/ai/extract-diet`,
    form,
    { headers: form.getHeaders(), maxBodyLength: Infinity, timeout: 30_000 },
  );
  return data;
}

/** Envía la foto del plato + ingredientes esperados al microservicio de IA para validación visual. */
export async function validatePlate(
  file: Express.Multer.File,
  ingredients: unknown,
): Promise<PlateValidation> {
  const form = buildFileForm(file);
  form.append('ingredients', JSON.stringify(ingredients));
  const { data } = await axios.post<PlateValidation>(
    `${config.aiServiceUrl}/ai/validate-plate`,
    form,
    { headers: form.getHeaders(), maxBodyLength: Infinity, timeout: 30_000 },
  );
  return data;
}
