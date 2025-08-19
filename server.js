//Load .env only in development (Heroku/Render use config vars)
if (process.env.NODE_ENV !== 'production') {
  const { default: dotenv } = await import('dotenv');
  dotenv.config();
}

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
    // In prod, consider setting a specific origin via CLIENT_ORIGIN
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);

// Helpful behind proxies (Heroku/Render) for secure cookies, req.ip, etc.
app.set('trust proxy', 1);

//Import routes AFTER dotenv has populated process.env
const externalRoutes = (await import('./routes/externalRoutes.js')).default;
const tripsRouter    = (await import('./routes/tripsRoutes.js')).default;
const usersRouter    = (await import('./routes/userRoutes.js')).default;
const wishlistRoutes = (await import('./routes/wishlistRoutes.js')).default;

//Routes (API first)
app.use('/api', externalRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/trips', tripsRouter);
app.use('/api/user', usersRouter);

// Healthcheck
app.get('/health', (_req, res) => res.status(200).send('ok'));

//Static (Vite build) LAST, only in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;

//Start only after Mongo connects (fail fast if URI missing)
(async () => {
  try {
    if (!MONGO_URI) throw new Error('Missing MONGODB_URI (or MONGODB_URL)');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err?.message || err);
    process.exit(1);
  }
})();
