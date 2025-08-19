import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

//Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);

// Helpful on Heroku/Render if you read req.ip or use secure cookies behind a proxy
app.set('trust proxy', 1);

//Routes (API first)
import externalRoutes from './routes/externalRoutes.js';
import tripsRouter from './routes/tripsRoutes.js';
import usersRouter from './routes/userRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';

app.use('/api', externalRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/trips', tripsRouter);
app.use('/api/user', usersRouter);

// Simple healthcheck
app.get('/health', (_req, res) => res.status(200).send('ok'));

// Static (Vite build) LAST, only in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;

// Start only after Mongo connects (fail fast if URI missing)
const URI = process.env.MONGODB_URL;

(async () => {
  try {
    if (!URI) throw new Error('MONGODB_URL not set');
    await mongoose.connect(URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
})();
