import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import tripRoutes from '../routes/tripsRoutes.js';
import userRoutes from '../routes/userRoutes.js';
import './setup.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/trips', tripRoutes);
app.use('/api/user', userRoutes);

describe('Trip Routes', () => {
  let token;

  beforeEach(async () => {
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
    token = res.body.accesstoken;
  });

  describe('POST /api/trips/getaway-trip', () => {
    it('should create a trip with valid data', async () => {
      const res = await request(app)
        .post('/api/trips/getaway-trip')
        .set('Authorization', token)
        .send({
          user_email: 'john@example.com',
          location_address: 'Paris, France',
          trip_start: '2024-06-01',
          trip_end: '2024-06-10',
          stay_expense: 1000,
          travel_expense: 500,
          car_expense: 200,
          other_expense: 100,
          image_url: 'https://example.com/image.jpg',
          isFavorite: false,
          activities: ['Eiffel Tower', 'Louvre'],
        });

      expect(res.status).toBe(200);
      expect(res.body.msg).toBe('Created a planned trip');
    });

    it('should fail without auth token', async () => {
      const res = await request(app).post('/api/trips/getaway-trip').send({
        user_email: 'john@example.com',
        location_address: 'Paris, France',
        image_url: 'https://example.com/image.jpg',
      });

      expect(res.status).toBe(400);
    });

    it('should fail with invalid expense values', async () => {
      const res = await request(app)
        .post('/api/trips/getaway-trip')
        .set('Authorization', token)
        .send({
          user_email: 'john@example.com',
          location_address: 'Paris, France',
          stay_expense: -100,
          image_url: 'https://example.com/image.jpg',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/trips/getaway-trip', () => {
    it('should list user trips', async () => {
      const res = await request(app)
        .get('/api/trips/getaway-trip')
        .query({ email: 'john@example.com' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
