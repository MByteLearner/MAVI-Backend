import 'dotenv/config';
import express from 'express';
import { config } from './config';
import { errorHandler } from './middleware/error';
import { apiRouter } from './routes';

export const app = express();

app.use(express.json());

// Fotos de platos validados (photo_url de MealLog)
app.use('/uploads', express.static(config.uploadsDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRouter);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`MAVI Core API escuchando en el puerto ${config.port}`);
  });
}

