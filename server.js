require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const https = require('https');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());

//Place Details
app.get('/api/places-details', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLEAPIKEY;
    const placeid = req.query.placeid;

    const options = {
      hostname: 'places.googleapis.com',
      path: `/v1/places/${placeid}?fields=id,displayName,photos&key=${apiKey}`,
      method: 'GET'
    };

    const request = https.request(options, response => {
      let data = '';

      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          res.json(parsedData);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          res.status(500).json({ error: 'Failed to parse response data' });
        }
      });
    });

    request.on('error', error => {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
    });

    request.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

//Photos API
app.get('/api/places-pics', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLEAPIKEY;
    const photoreference = req.query.photoreference;
    
    const options = {
      hostname: 'places.googleapis.com',
      path: `/v1/${photoreference}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`,
      method: 'GET'
    };

    const request = https.request(options, response => {
      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        // Check if the response contains 'content-encoding' header and set it to the client
        if (response.headers['content-encoding']) {
          res.set('Content-Encoding', response.headers['content-encoding']);
        }

        // Send the binary image data
        res.send(Buffer.from(data, 'binary'));
      });
    });

    request.on('error', error => {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
    });

    request.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Routes
const tripsRouter = require('./routes/tripsRoutes');
app.use('/api/trips', tripsRouter);

const usersRouter = require('./routes/userRoutes');
app.use('/api/user', usersRouter);

// Connect to MongoDB using promises
const URI = process.env.MONGODB_URL;

//connect to DB
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