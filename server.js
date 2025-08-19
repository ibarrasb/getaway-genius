// server.js (CommonJS)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// ----- Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true
}));

// Helpful on Heroku if you ever read req.ip or use secure cookies behind the proxy
app.set('trust proxy', 1);

// ----- Routes (API first)
const externalRoutes = require('./routes/externalRoutes');
const tripsRouter = require('./routes/tripsRoutes');
const usersRouter = require('./routes/userRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

app.use('/api', externalRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/trips', tripsRouter);
app.use('/api/user', usersRouter);

// Simple healthcheck
app.get('/health', (_req, res) => res.status(200).send('ok'));

// ----- Static (Vite build) LAST, only in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;

// ----- Start only after Mongo connects (fail fast if URI missing)
const URI = process.env.MONGODB_URL;
(async () => {
  try {
    if (!URI) {
      throw new Error('MONGODB_URL not set');
    }
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
