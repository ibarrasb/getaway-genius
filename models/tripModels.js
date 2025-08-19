// models/tripModels.js (ESM)

import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    user_email: {
      type: String,
      required: true,
    },
    location_address: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    isFavorite: {
      type: Boolean,
      default: false, // Default value is false
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
