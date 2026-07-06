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

const parseAllowedOrigins = () => {
  const configured = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length) return configured;
  if (process.env.NODE_ENV === 'production') return [];

  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
};

const allowedOrigins = parseAllowedOrigins();

//Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
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
  const clientAssets = path.join(clientDist, 'assets');

  app.use(
    '/assets',
    express.static(clientAssets, {
      immutable: true,
      maxAge: '1y',
    })
  );
  app.use('/assets', (_req, res) => res.status(404).type('text/plain').send('Asset not found'));

  app.use(
    express.static(clientDist, {
      index: false,
      setHeaders(res, filePath) {
        if (path.basename(filePath) === 'index.html') {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );

  app.get('*', (req, res) => {
    if (path.extname(req.path)) {
      return res.status(404).type('text/plain').send('Not found');
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGODB_URL;

(async () => {
  try {
    if (!MONGO_URI) throw new Error('MONGODB_URL not set');
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
