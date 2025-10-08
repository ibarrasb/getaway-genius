//Load .env only in development (Heroku/Render use config vars)
if (process.env.NODE_ENV !== 'production') {
  const { default: dotenv } = await import('dotenv');
  dotenv.config();
}

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'crypto';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(helmet());
app.use(compression());
app.use(cookieParser());

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
    customProps: (req) => ({ requestId: req.id }),
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      details: {},
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

const externalRoutes = (await import('./routes/externalRoutes.js')).default;
const tripsRouter = (await import('./routes/tripsRoutes.js')).default;
const usersRouter = (await import('./routes/userRoutes.js')).default;
const wishlistRoutes = (await import('./routes/wishlistRoutes.js')).default;
const { notFoundHandler, errorHandler } = await import('./middleware/errorHandler.js');
const swaggerSpec = (await import('./config/swagger.js')).default;

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', externalRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/trips', tripsRouter);
app.use('/api/user', usersRouter);
app.get('/health', (_req, res) => res.status(200).send('ok'));

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
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
