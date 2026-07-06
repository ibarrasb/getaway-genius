import mongoose from 'mongoose';

const apiCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.models.ApiCache || mongoose.model('ApiCache', apiCacheSchema);
