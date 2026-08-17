import { Router } from 'express';
import { getMe, login, register } from '../controllers/auth.controller';
import { uploadDiet } from '../controllers/diets.controller';
import { validateMeal } from '../controllers/meals.controller';
import { getSuggestedRecipes } from '../controllers/recipes.controller';
import { getProfile, updateProfile } from '../controllers/users.controller';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';
import { dietUpload, plateUpload } from '../middleware/upload';

import { sendChatToAIService } from '../services/ai.service';

export const apiRouter = Router();

// Rutas públicas de autenticación
apiRouter.post('/auth/register', asyncHandler(register));
apiRouter.post('/auth/login', asyncHandler(login));

// Rutas protegidas de información y perfil del usuario
apiRouter.get('/auth/me', authenticateToken, asyncHandler(getMe));
apiRouter.get('/users/profile', authenticateToken, asyncHandler(getProfile));
apiRouter.put('/users/profile', authenticateToken, asyncHandler(updateProfile));

// Rutas protegidas del sistema
apiRouter.post(
  '/diets/upload',
  authenticateToken,
  dietUpload.single('file'),
  asyncHandler(uploadDiet),
);
apiRouter.get('/recipes', authenticateToken, asyncHandler(getSuggestedRecipes));
apiRouter.post(
  '/meals/validate',
  authenticateToken,
  plateUpload.single('file'),
  asyncHandler(validateMeal),
);
const handleChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: 'El mensaje es requerido' });
    return;
  }
  const userName = req.user ? req.user.email.split('@')[0] : 'Usuario';
  const result = await sendChatToAIService(message, userName);
  res.json(result);
});

apiRouter.post('/ai/chat', optionalAuthenticateToken, handleChat);
apiRouter.post('/ia/chat', optionalAuthenticateToken, handleChat);


