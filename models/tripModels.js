// models/tripModels.js
import mongoose from 'mongoose';

const InstanceSchema = new mongoose.Schema(
  {
    option_title: { type: String, default: '' },
    destination: { type: String, default: '' },
    image_url: { type: String, default: '' },
    status: {
      type: String,
      enum: ['considering', 'top_choice', 'eliminated', 'booked'],
      default: 'considering',
    },
    trip_start: { type: Date, default: null },
    trip_end: { type: Date, default: null },
    stay_expense: { type: Number, default: 0 },
    travel_expense: { type: Number, default: 0 },
    car_expense: { type: Number, default: 0 },
    other_expense: { type: Number, default: 0 },
    cost_items: {
      type: [
        {
          category: { type: String, default: 'other' },
          name: { type: String, default: '' },
          url: { type: String, default: '' },
          price: { type: Number, default: 0 },
          quantity: { type: Number, default: 1 },
          start_date: { type: Date, default: null },
          end_date: { type: Date, default: null },
          notes: { type: String, default: '' },
        },
      ],
      default: [],
    },
    notes: { type: String, default: '' },
    isCommitted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, _id: true }
);

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', index: true, default: null },
  user_email: String,
  board_title: { type: String, default: '' },
  board_start: { type: Date, default: null },
  board_end: { type: Date, default: null },
  travelers: { type: Number, default: 1 },
  location_address: String,
  trip_start: Date,
  trip_end: Date,
  stay_expense: Number,
  travel_expense: Number,
  car_expense: Number,
  other_expense: Number,
  image_url: String,
  cloudinaryUploaded: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  activities: [String],
  instances: { type: [InstanceSchema], default: [] },
  committedInstanceId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

TripSchema.index({ userId: 1, createdAt: -1 });
TripSchema.index({ user_email: 1, createdAt: -1 });

export default mongoose.model('Trips', TripSchema);
