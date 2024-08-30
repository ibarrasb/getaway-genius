const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  list_name: {
    type: String,
    required: true,
  },
  trips: {
    type: [Object], // Defines the trips field as an array of objects
    default: [],    // Sets the default value to an empty array
  },
  email: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
