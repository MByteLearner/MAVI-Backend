import request from 'supertest';
import { app } from '../index';
import { prisma } from '../lib/prisma';

describe('Módulo de Autenticación (/api/auth)', () => {
  const testEmail = `test_${Date.now()}@mavi.com`;
  const testPassword = 'password123';
  let token = '';

  afterAll(async () => {
    // Limpieza del usuario de prueba creado
    await prisma.user.deleteMany({ where: { email: { contains: 'test_' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('debe rechazar el registro sin email o contraseña (400)', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('debe registrar un nuevo usuario con éxito (201)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: testEmail,
        password: testPassword,
        name: 'Usuario Pruebas',
        goals: ['Saludable'],
        allergies: ['Ninguna'],
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.name).toBe('Usuario Pruebas');
    });

    it('debe evitar el registro duplicado del mismo email (400)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('registrado');
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe denegar inicio de sesión con contraseña incorrecta (401)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('inválidas');
    });

    it('debe iniciar sesión exitosamente con credenciales válidas (200)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testEmail);

      token = res.body.token;
    });
  });

  describe('GET /api/auth/me', () => {
    it('debe rechazar solicitudes sin encabezado Authorization (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('debe retornar la información del usuario autenticado con token válido (200)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(testEmail);
    });
  });
});
