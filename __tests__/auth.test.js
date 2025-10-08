import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import userRoutes from '../routes/userRoutes.js';
import './setup.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/user', userRoutes);

describe('Auth Routes', () => {
  describe('POST /api/user/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/user/register').send({
        fname: 'John',
        lname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        birthday: '1990-01-01',
        city: 'New York',
        state: 'NY',
        zip: 10001,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accesstoken');
    });

    it('should fail with invalid email', async () => {
      const res = await request(app).post('/api/user/register').send({
        fname: 'John',
        lname: 'Doe',
        email: 'invalid-email',
        password: 'password123',
        birthday: '1990-01-01',
        city: 'New York',
        state: 'NY',
        zip: 10001,
      });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/user/login', () => {
    it('should login with valid credentials', async () => {
      await request(app).post('/api/user/register').send({
        fname: 'John',
        lname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        birthday: '1990-01-01',
        city: 'New York',
        state: 'NY',
        zip: 10001,
      });

      const res = await request(app).post('/api/user/login').send({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accesstoken');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app).post('/api/user/login').send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(400);
    });
  });
});
