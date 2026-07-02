import Trips from '../models/tripModels.js';  
import Wishlist from '../models/wishlistModel.js';
import Users from '../models/userModels.js';
import mongoose from 'mongoose';
import { createHash } from 'crypto';
import { uploadImageBuffer } from '../services/cloudinary.js';

const getAuthContext = async (req) => {
  if (!req.user?.id) return null;
  const user = await Users.findById(req.user.id).select('email');
  if (!user?.email) return null;
  return { userId: req.user.id, userEmail: user.email };
};

const buildTripOwnershipFilter = ({ userId }) => ({ userId });

const buildWishlistOwnershipFilter = ({ userId }) => ({ userId });

const findOwnedTrip = async (tripId, authCtx) => {
  if (!mongoose.isValidObjectId(tripId)) return null;
  return Trips.findOne({ _id: tripId, ...buildTripOwnershipFilter(authCtx) });
};

const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const sanitizeCostItems = (items) =>
  (Array.isArray(items) ? items : [])
    .filter((item) => item && (item.name || item.url || Number(item.price) > 0))
    .map((item) => ({
      category: String(item.category || 'other'),
      name: String(item.name || ''),
      url: String(item.url || ''),
      price: num(item.price),
      quantity: Math.max(1, num(item.quantity, 1)),
      start_date: parseDate(item.start_date),
      end_date: parseDate(item.end_date),
      notes: String(item.notes || ''),
    }));

const sanitizeInstancePayload = (body = {}) => ({
  option_title: String(body.option_title || ''),
  destination: String(body.destination || ''),
  image_url: String(body.image_url || ''),
  status: ['considering', 'top_choice', 'eliminated', 'booked'].includes(body.status)
    ? body.status
    : 'considering',
  trip_start: parseDate(body.trip_start),
  trip_end: parseDate(body.trip_end),
  stay_expense: num(body.stay_expense),
  travel_expense: num(body.travel_expense),
  car_expense: num(body.car_expense),
  other_expense: num(body.other_expense),
  cost_items: sanitizeCostItems(body.cost_items),
  notes: String(body.notes || ''),
});

// GET /getaway-trip
export const getTrips = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const trips = await Trips.find(buildTripOwnershipFilter(authCtx));
    res.json(trips);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// GET /favorites
export const getFavoriteTrips = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const trips = await Trips.find({ ...buildTripOwnershipFilter(authCtx), isFavorite: true });
    res.json(trips);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// POST /getaway-trip
export const createTrips = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    let {
      board_title,
      board_start,
      board_end,
      travelers,
      location_address,
      trip_start,
      trip_end,
      stay_expense,
      travel_expense,
      car_expense,
      other_expense,
      image_url,
      isFavorite,
      activities,
      instances,
    } = req.body;

    image_url = image_url || '';

    let cloudinaryUploaded = false;

    if (image_url && image_url.includes('places.googleapis.com/v1/') && image_url.includes('/media')) {
      try {
        const urlObj = new URL(image_url);
        const pathMatch = urlObj.pathname.match(/^\/v1\/(.+)\/media$/);
        
        if (pathMatch) {
          const photoreference = pathMatch[1];
          const shortHash = createHash('sha256').update(photoreference).digest('hex').slice(0, 32);
          
          const apiKey = process.env.GOOGLEAPIKEY;
          const googleMediaUrl = `https://places.googleapis.com/v1/${photoreference}/media?key=${apiKey}&maxHeightPx=400&maxWidthPx=400`;
          
          const resp = await fetch(googleMediaUrl);
          if (resp.ok) {
            const buf = Buffer.from(await resp.arrayBuffer());
            const cloudinaryUrl = await uploadImageBuffer(buf, shortHash);
            image_url = cloudinaryUrl;
            cloudinaryUploaded = true;
          }
        }
      } catch (uploadError) {
        console.error('Failed to upload to Cloudinary during trip creation:', uploadError);
      }
    } else if (image_url.includes('res.cloudinary.com')) {
      cloudinaryUploaded = true;
    }

    const newVacation = new Trips({
      userId: authCtx.userId,
      user_email: authCtx.userEmail,
      board_title,
      board_start: parseDate(board_start),
      board_end: parseDate(board_end),
      travelers: Math.max(1, num(travelers, 1)),
      location_address: location_address || board_title,
      trip_start: parseDate(trip_start || board_start),
      trip_end: parseDate(trip_end || board_end),
      stay_expense,
      travel_expense,
      car_expense,
      other_expense,
      image_url,
      cloudinaryUploaded,
      isFavorite,
      activities,
      instances: Array.isArray(instances)
        ? instances.map((instance) => sanitizeInstancePayload(instance))
        : [],
    });

    await newVacation.save();
    res.json({ msg: 'Created a planning board', trip: newVacation });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// DELETE /getaway/:id
export const deleteTrip = async (req, res) => {  
  try {  
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const tripId = req.params.id;  
    const trip = await findOwnedTrip(tripId, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });
      
    // Remove trip from all wishlists that contain it  
    await Wishlist.updateMany(  
      {
        ...buildWishlistOwnershipFilter(authCtx),
        "trips._id": tripId,
      },  
      { $pull: { trips: { _id: tripId } } }  
    );  
      
    // Delete the trip itself  
    await Trips.findByIdAndDelete(trip._id);  
      
    res.json({ msg: 'Deleted a Trip and removed from all wishlists' });  
  } catch (err) {  
    return res.status(500).json({ msg: err.message });  
  }  
};

// PUT /getaway/:id
export const updateTrip = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const existingTrip = await findOwnedTrip(req.params.id, authCtx);
    if (!existingTrip) return res.status(404).json({ msg: 'Trip not found' });

    let {
      board_title,
      board_start,
      board_end,
      travelers,
      location_address,
      trip_start,
      trip_end,
      stay_expense,
      travel_expense,
      car_expense,
      other_expense,
      image_url,
      isFavorite,
      activities,
      instances,
    } = req.body;

    if (Array.isArray(instances)) {
      instances = instances.map((instance) => ({
        ...sanitizeInstancePayload(instance),
        _id: instance._id,
        isCommitted: Boolean(instance.isCommitted),
        createdAt: instance.createdAt || new Date(),
      }));
    }

    await Trips.findOneAndUpdate(
      { _id: existingTrip._id, ...buildTripOwnershipFilter(authCtx) },
      {
        userId: authCtx.userId,
        user_email: authCtx.userEmail,
        board_title,
        board_start: parseDate(board_start),
        board_end: parseDate(board_end),
        travelers: Math.max(1, num(travelers, 1)),
        location_address,
        trip_start: parseDate(trip_start || board_start),
        trip_end: parseDate(trip_end || board_end),
        stay_expense,
        travel_expense,
        car_expense,
        other_expense,
        image_url,
        isFavorite,
        activities,
        instances,
      }
    );

    res.json({ msg: 'Updated a Trip' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// GET /getaway/:id
export const getSpecificTrip = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const detailedTrip = await findOwnedTrip(req.params.id, authCtx);
    if (!detailedTrip) return res.status(404).json({ msg: 'Trip not found' });

    res.json(detailedTrip);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

//TRIP INSTANCES------------
export const addTripInstance = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const { id } = req.params;
    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const instance = {
      _id: new mongoose.Types.ObjectId(),
      ...sanitizeInstancePayload(req.body),
      createdAt: new Date(),
      isCommitted: false,
    };

    const updated = await Trips.findByIdAndUpdate(
      trip._id,
      { $push: { instances: instance } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Trip not found' });

    return res.status(201).json(updated);
  } catch (err) {
    console.error('addTripInstance error:', err);
    return res.status(400).json({ msg: err.message || 'Invalid instance payload' });
  }
};

export const commitTripInstance = async (req, res) => {
  try {
    const { id, instanceId } = req.params;
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(instanceId)) {
      return res.status(400).json({ msg: 'Invalid trip or instance id' });
    }

    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const instanceExists = trip.instances.some(
      (inst) => inst._id.toString() === instanceId
    );
    if (!instanceExists) {
      return res.status(404).json({ msg: 'Instance not found' });
    }

    trip.instances.forEach((inst) => {
      inst.isCommitted = inst._id.toString() === instanceId;
    });
    trip.committedInstanceId = new mongoose.Types.ObjectId(String(instanceId));

    await trip.save();

    return res.status(200).json({ msg: 'Instance committed', trip });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

export const getTripInstance = async (req, res) => {
  try {
    const { id, instanceId } = req.params;
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(instanceId)) {
      return res.status(400).json({ msg: 'Invalid trip or instance id' });
    }

    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const instance = trip.instances.find(
      (inst) => inst._id.toString() === instanceId
    );

    if (!instance) {
      return res.status(404).json({ msg: 'Instance not found' });
    }

    return res.status(200).json({ trip, instance });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

export const deleteTripInstance = async (req, res) => {
  try {
    const { id, instanceId } = req.params;
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(instanceId)) {
      return res.status(400).json({ msg: 'Invalid trip or instance id' });
    }

    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    if (trip.committedInstanceId?.toString() === instanceId) {
      trip.committedInstanceId = null;
    }

    trip.instances = trip.instances.filter(
      (inst) => inst._id.toString() !== instanceId
    );

    await trip.save();

    return res.status(200).json({
      msg: 'Instance deleted',
      instances: trip.instances,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
