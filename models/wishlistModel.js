import mongoose from 'mongoose';

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

wishlistSchema.index({ userId: 1, createdAt: -1 });
wishlistSchema.index({ email: 1, createdAt: -1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
