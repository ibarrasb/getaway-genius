require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios')
const path = require('path');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());

//Place Details
// app.get('/api/places-details', async (req, res) => {
//   try {
//     const apiKey = process.env.GOOGLEAPIKEY;
//     const placeid = req.query.placeid;
//     const response = await axios.get(`hhttps://places.googleapis.com/v1/places/${placeid}?fields=id,displayName,photos&key=${apiKey}`);

//     const data = response.data;
//     res.json(data);
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Failed to fetch data' });
//   }
// });

//Photos API
// app.get('/api/place-photos', async (req, res) => {
//   try {
//     const apiKey = process.env.GOOGLEAPIKEY;
//     const photoReference = req.query.photo_reference;
//     let params = 'maxHeightPx=400&maxWidthPx=400';
//     const response = await axios.get(`https://places.googleapis.com/v1/${photoReference}/media?key=${apiKey}&${params}`);

//     const data = response.data;
//     res.json(data);
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Failed to fetch data' });
//   }
// });



// Routes
const usersRouter = require('./routes/userRoutes');
app.use('/api/user', usersRouter);

// Connect to MongoDB using promises
const URI = process.env.MONGODB_URL;

async function connectToMongo() {
  try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Build for Heroku
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server is running on port..', PORT);
});

connectToMongo();