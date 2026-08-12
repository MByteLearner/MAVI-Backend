export const config = {
  port: Number(process.env.PORT ?? 3000),
  aiServiceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  uploadsDir: process.env.UPLOADS_DIR ?? 'uploads',
  jwtSecret: process.env.JWT_SECRET ?? 'mavi_super_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
} as const;
