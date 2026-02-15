import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Users from '../models/userModels.js';
import Trips from '../models/tripModels.js';
import Wishlist from '../models/wishlistModel.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URL;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const run = async () => {
  if (!MONGO_URI) {
    throw new Error('MONGODB_URL not set');
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await Users.find({}, { _id: 1, email: 1 }).lean();
  const emailToUserId = new Map();
  for (const user of users) {
    const key = normalizeEmail(user.email);
    if (key) emailToUserId.set(key, user._id);
  }

  let tripsUpdated = 0;
  let wishlistsUpdated = 0;

  const trips = await Trips.find(
    { $or: [{ userId: { $exists: false } }, { userId: null }] },
    { _id: 1, user_email: 1 }
  ).lean();

  for (const trip of trips) {
    const ownerId = emailToUserId.get(normalizeEmail(trip.user_email));
    if (!ownerId) continue;
    const result = await Trips.updateOne(
      { _id: trip._id, $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $set: { userId: ownerId } }
    );
    tripsUpdated += result.modifiedCount || 0;
  }

  const wishlists = await Wishlist.find(
    { $or: [{ userId: { $exists: false } }, { userId: null }] },
    { _id: 1, email: 1 }
  ).lean();

  for (const list of wishlists) {
    const ownerId = emailToUserId.get(normalizeEmail(list.email));
    if (!ownerId) continue;
    const result = await Wishlist.updateOne(
      { _id: list._id, $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $set: { userId: ownerId } }
    );
    wishlistsUpdated += result.modifiedCount || 0;
  }

  console.log(`Trips updated: ${tripsUpdated}`);
  console.log(`Wishlists updated: ${wishlistsUpdated}`);
};

run()
  .then(async () => {
    await mongoose.disconnect();
    console.log('Done');
  })
  .catch(async (err) => {
    console.error('Backfill failed:', err?.message || err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect errors in failure path
    }
    process.exit(1);
  });
