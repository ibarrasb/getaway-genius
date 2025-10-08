import mongoose from 'mongoose';

/**
 * Schema for trip instances representing different date/cost scenarios
 */
const InstanceSchema = new mongoose.Schema(
  {
    trip_start: { type: Date, default: null },
    trip_end: { type: Date, default: null },
    stay_expense: { type: Number, min: 0, default: 0 },
    travel_expense: { type: Number, min: 0, default: 0 },
    car_expense: { type: Number, min: 0, default: 0 },
    other_expense: { type: Number, min: 0, default: 0 },
    isCommitted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/**
 * Schema for planned trips with location, dates, expenses, and instances
 */
const TripSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true },
    location_address: { type: String, required: true },
    trip_start: { type: Date, default: null },
    trip_end: { type: Date, default: null },
    stay_expense: { type: Number, min: 0, default: 0 },
    travel_expense: { type: Number, min: 0, default: 0 },
    car_expense: { type: Number, min: 0, default: 0 },
    other_expense: { type: Number, min: 0, default: 0 },
    image_url: { type: String, required: true },
    isFavorite: { type: Boolean, default: false },
    activities: { type: [String], default: [] },
    instances: { type: [InstanceSchema], default: [] },
    committedInstanceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

TripSchema.index({ user_email: 1, createdAt: -1 });
TripSchema.index({ committedInstanceId: 1 });

export default mongoose.model('Trips', TripSchema);
