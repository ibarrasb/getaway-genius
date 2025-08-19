// models/wishlistModel.js (ESM)

import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    list_name: {
      type: String,
      required: true,
    },
    trips: {
      type: [Object], // array of arbitrary objects
      default: [],
    },
    email: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
  }
);

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
