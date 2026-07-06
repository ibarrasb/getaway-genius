import mongoose from 'mongoose';

const wishlistTripSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripBoard',
      index: true,
      default: null,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { strict: false }
);

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      default: null,
      index: true,
    },
    list_name: {
      type: String,
      required: true,
    },
    trips: {
      type: [wishlistTripSchema],
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

wishlistSchema.index({ userId: 1, createdAt: -1 });
wishlistSchema.index({ email: 1, createdAt: -1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
