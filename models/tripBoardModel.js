import mongoose from 'mongoose';

export const TripOptionSchema = new mongoose.Schema(
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
          price_basis: { type: String, default: '' },
          item_type: { type: String, default: '' },
          group_name: { type: String, default: '' },
          is_selected: { type: Boolean, default: true },
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
  { _id: true }
);

export const TripBoardSchema = new mongoose.Schema(
  {
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
    instances: { type: [TripOptionSchema], default: [] },
    committedInstanceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

TripBoardSchema.index({ userId: 1, createdAt: -1 });
TripBoardSchema.index({ user_email: 1, createdAt: -1 });

export default mongoose.models.TripBoard || mongoose.model('TripBoard', TripBoardSchema, 'trips');
