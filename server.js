require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Import routes
const externalRoutes = require('./routes/externalRoutes');
const tripsRouter = require('./routes/tripsRoutes');
const usersRouter = require('./routes/userRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

// Use routes
app.use('/api', externalRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/trips', tripsRouter);
app.use('/api/user', usersRouter);

// Connect to MongoDB
const URI = process.env.MONGODB_URL;

async function connectToMongo() {
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
    });
}

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Server is running on port', PORT);
});

// Connect to MongoDB
connectToMongo();
