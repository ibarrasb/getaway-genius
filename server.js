require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path'); // Import the 'path' module

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Routes
app.use('/user', require('./routes/userRoutes'));


// Connect to MongoDB using promises
const URI = process.env.MONGODB_URL;
mongoose.connect(URI, {
   
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });


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
