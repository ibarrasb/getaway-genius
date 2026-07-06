// controllers/wishCtrl.js (ESM)

import Wishlist from '../models/wishlistModel.js';
import Users from '../models/userModels.js';
import mongoose from 'mongoose';
import { isPlainObject } from '../middleware/validate.js';

const getAuthContext = async (req) => {
  if (!req.user?.id) return null;
  const user = await Users.findById(req.user.id).select('email');
  if (!user?.email) return null;
  return { userId: req.user.id, userEmail: user.email };
};

const buildWishlistOwnershipFilter = ({ userId }) => ({ userId });

const normalizeWishlistTrip = (trip = {}) => {
  const source = isPlainObject(trip?.snapshot) ? trip.snapshot : trip;
  const rawId = trip?.tripId || source?._id;
  const tripId = mongoose.isValidObjectId(rawId) ? rawId : null;

  return {
    tripId,
    snapshot: isPlainObject(source) ? source : {},
    addedAt: trip?.addedAt || new Date(),
  };
};

const normalizeWishlistTrips = (trips) =>
  (Array.isArray(trips) ? trips : [])
    .filter(Boolean)
    .map(normalizeWishlistTrip);

const serializeWishlistTrip = (trip = {}) => {
  const snapshot = isPlainObject(trip.snapshot) ? trip.snapshot : trip;
  const id = trip.tripId || snapshot._id || trip._id;

  return {
    ...snapshot,
    _id: id?.toString?.() || id,
    wishlistTripId: trip._id?.toString?.(),
    addedAt: trip.addedAt,
  };
};

const serializeWishlist = (wishlist) => {
  const plain = typeof wishlist?.toObject === 'function' ? wishlist.toObject() : wishlist;
  if (!plain) return plain;
  return {
    ...plain,
    trips: (plain.trips || []).map(serializeWishlistTrip),
  };
};

// Create a new wishlist
export const createWishlist = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const { list_name, trips } = req.body;
    if (!String(list_name || '').trim()) {
      return res.status(400).json({ msg: 'Wishlist name is required' });
    }

    const wishlist = new Wishlist({
      userId: authCtx.userId,
      list_name: String(list_name).trim(),
      trips: normalizeWishlistTrips(trips),
      email: authCtx.userEmail,
    });

    await wishlist.save();
    res.json({ msg: 'Created a wishlist' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: err.message });
  }
};

// Fetch all wishlists
export const fetchLists = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const wishlists = await Wishlist.find(buildWishlistOwnershipFilter(authCtx)).sort({ createdAt: -1 });
    res.status(200).json(wishlists.map(serializeWishlist));
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Update an existing wishlist
export const updateList = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const { id } = req.params;
    const { list_name, trips } = req.body; // use list_name to be consistent
    if (!String(list_name || '').trim()) {
      return res.status(400).json({ msg: 'Wishlist name is required' });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { _id: id, ...buildWishlistOwnershipFilter(authCtx) },
      {
        userId: authCtx.userId,
        email: authCtx.userEmail,
        list_name: String(list_name).trim(),
        trips: normalizeWishlistTrips(trips),
      },
      { new: true }
    );

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    res.status(200).json(serializeWishlist(wishlist));
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Add a trip to an existing wishlist
export const addTripToWishlist = async (req, res) => {
  const { id } = req.params; // Wishlist ID
  const trip = req.body;     // Trip object

  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { _id: id, ...buildWishlistOwnershipFilter(authCtx) },
      {
        $set: { userId: authCtx.userId, email: authCtx.userEmail },
        $push: { trips: normalizeWishlistTrip(trip) },
      },
      { new: true }
    );

    if (!updatedWishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    res.status(200).json({
      message: 'Trip added to wishlist successfully',
      wishlist: serializeWishlist(updatedWishlist),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding trip to wishlist', error });
  }
};

// Remove a trip from an existing wishlist
export const removeTripFromWishlist = async (req, res) => {
  const { wishlistId, tripId } = req.params;

  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { _id: wishlistId, ...buildWishlistOwnershipFilter(authCtx) },
      {
        $set: { userId: authCtx.userId, email: authCtx.userEmail },
        $pull: {
          trips: {
            $or: [
              { tripId },
              { _id: tripId },
              { 'snapshot._id': tripId },
            ],
          },
        },
      },
      { new: true }
    );

    if (!updatedWishlist) {
      return res
        .status(404)
        .json({ message: 'Wishlist or trip not found' });
    }

    res
      .status(200)
      .json({
        message: 'Trip removed from wishlist successfully',
        updatedWishlist: serializeWishlist(updatedWishlist),
      });
  } catch (error) {
    res.status(500).json({ message: 'Error removing trip from wishlist', error });
  }
};

// Remove an entire wishlist
export const removeWishlist = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const deleted = await Wishlist.findOneAndDelete({
      _id: req.params.id,
      ...buildWishlistOwnershipFilter(authCtx),
    });
    if (!deleted) return res.status(404).json({ msg: 'Wishlist not found' });

    res.json({ msg: 'Deleted a Wishlist' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Fetch one wishlist by ID
export const fetchWishlist = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const detailedWishlist = await Wishlist.findOne({
      _id: req.params.id,
      ...buildWishlistOwnershipFilter(authCtx),
    });
    if (!detailedWishlist) return res.status(404).json({ msg: 'Wishlist not found' });

    res.json(serializeWishlist(detailedWishlist));
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
