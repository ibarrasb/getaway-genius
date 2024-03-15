require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios')
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
    
    const response = await axios.get(`https://places.googleapis.com/v1/places/${placeid}?fields=id,displayName,photos&key=${apiKey}`);

    const data = response.data;
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// app.get('/api/places-pics', async (req, res) => {
//   try {
//     const apiKey = process.env.GOOGLEAPIKEY;
//     const photoreference = req.query.photoreference;
    
//     const response = await axios.get(`https://places.googleapis.com/v1/${photoreference}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`, {
//       responseType: 'arraybuffer' // Set responseType to 'arraybuffer' to handle binary data
//     });

//     // Check if the response contains 'content-encoding' header and set it to the client
//     if (response.headers['content-encoding']) {
//       res.set('Content-Encoding', response.headers['content-encoding']);
//     }

//     // Send the binary image data
//     res.send(response.data);
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Failed to fetch image data' });
//   }
// });
// const getVideo = async () => {
//       try {
//           const resp = await axios.get(
//               'https://www.googleapis.com/youtube/v3/search',
//               {
//                   headers: {
//                       'Content-Type': 'application/json',
//                       'Accept-Encoding': 'application/json',
//                   },
//                   params: {
//                       'part': 'snippet',
//                       'channelId': 'UCBYyJBCtCvgqA4NwtoPMwpQ',
//                       'maxResults': '1',
//                       'order': 'date',
//                       'type': 'video',
//                       'key': config.API_KEY
//                   }
//               }
//           );
//           console.log(JSON.stringify(resp.data, null, 4));
//       } catch (err) {
//           // Handle Error Here
//           console.error(err);
//       }
//   };
  

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