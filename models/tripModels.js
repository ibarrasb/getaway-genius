// models/tripModels.js
import mongoose from 'mongoose';

const InstanceSchema = new mongoose.Schema(
  {
    trip_start: { type: Date, default: null },
    trip_end: { type: Date, default: null },
    stay_expense: { type: Number, default: 0 },
    travel_expense: { type: Number, default: 0 },
    car_expense: { type: Number, default: 0 },
    other_expense: { type: Number, default: 0 },
    isCommitted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, _id: true }
);

const TripSchema = new mongoose.Schema({
  user_email: String,
  location_address: String,
  trip_start: Date,
  trip_end: Date,
  stay_expense: Number,
  travel_expense: Number,
  car_expense: Number,
  other_expense: Number,
  image_url: String,
  isFavorite: { type: Boolean, default: false },
  activities: [String],
  instances: { type: [InstanceSchema], default: [] },
  committedInstanceId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

export default mongoose.model('Trips', TripSchema);
