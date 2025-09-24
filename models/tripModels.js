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
    trip_start: {
      type: Date,
    },
    trip_end: {
      type: Date,
    },
    stay_expense: {
      type: Number,
      default: 0,
    },
    travel_expense: {
      type: Number,
      default: 0,
    },
    car_expense: {
      type: Number,
      default: 0,
    },
    other_expense: {
      type: Number,
      default: 0,
    },
    activities: {
      type: [String],
      default: [],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    committedInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripInstance',
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
