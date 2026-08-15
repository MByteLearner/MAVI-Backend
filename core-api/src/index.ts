import 'dotenv/config';
import express from 'express';
import { config } from './config';
import { errorHandler } from './middleware/error';
import { apiRouter } from './routes';

export const app = express();

// Middleware de CORS para permitir conexiones desde cualquier origen (ej. móvil/Expo)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Middleware de Logger para imprimir todas las peticiones entrantes en la consola del backend
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// Fotos de platos validados (photo_url de MealLog)
app.use('/uploads', express.static(config.uploadsDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRouter);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`MAVI Core API escuchando en el puerto ${config.port} (0.0.0.0)`);
  });
}

