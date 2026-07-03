import TripBoard from '../models/tripBoardModel.js';  
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
  return TripBoard.findOne({ _id: tripId, ...buildTripOwnershipFilter(authCtx) });
};

const getTripOptionId = (req) => req.params.optionId || req.params.instanceId;

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
    .filter(Boolean)
    .map((item) => {
      const sanitized = {
        category: String(item.category || 'other'),
        name: String(item.name || ''),
        url: String(item.url || ''),
        price: num(item.price),
        quantity: Math.max(1, num(item.quantity, 1)),
        price_basis: String(item.price_basis || ''),
        item_type: String(item.item_type || ''),
        group_name: String(item.group_name || ''),
        is_selected: item.is_selected === undefined ? true : Boolean(item.is_selected),
        start_date: parseDate(item.start_date),
        end_date: parseDate(item.end_date),
        notes: String(item.notes || ''),
      };

      if (mongoose.isValidObjectId(item._id)) sanitized._id = item._id;
      return sanitized;
    });

const sanitizeTripOptionPayload = (body = {}) => ({
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

// GET /boards
export const listTripBoards = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const trips = await TripBoard.find(buildTripOwnershipFilter(authCtx));
    res.json(trips);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// GET /favorites
export const listFavoriteTripBoards = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const trips = await TripBoard.find({ ...buildTripOwnershipFilter(authCtx), isFavorite: true });
    res.json(trips);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// POST /boards
export const createTripBoard = async (req, res) => {
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

    const newVacation = new TripBoard({
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
        ? instances.map((instance) => sanitizeTripOptionPayload(instance))
        : [],
    });

    await newVacation.save();
    res.json({ msg: 'Created a planning board', trip: newVacation });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// DELETE /boards/:id
export const deleteTripBoard = async (req, res) => {  
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
    await TripBoard.deleteOne({ _id: trip._id, ...buildTripOwnershipFilter(authCtx) });  
      
    res.json({ msg: 'Deleted a Trip and removed from all wishlists', tripId });  
  } catch (err) {  
    return res.status(500).json({ msg: err.message });  
  }  
};

// PUT /boards/:id
export const updateTripBoard = async (req, res) => {
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
        ...sanitizeTripOptionPayload(instance),
        _id: instance._id,
        isCommitted: Boolean(instance.isCommitted),
        createdAt: instance.createdAt || new Date(),
      }));
    }

    await TripBoard.findOneAndUpdate(
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

// GET /boards/:id
export const getTripBoard = async (req, res) => {
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

//TRIP OPTIONS------------
export const createTripOption = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const { id } = req.params;
    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const instance = {
      _id: new mongoose.Types.ObjectId(),
      ...sanitizeTripOptionPayload(req.body),
      createdAt: new Date(),
      isCommitted: false,
    };

    const updated = await TripBoard.findByIdAndUpdate(
      trip._id,
      { $push: { instances: instance } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Trip not found' });

    return res.status(201).json(updated);
  } catch (err) {
    console.error('createTripOption error:', err);
    return res.status(400).json({ msg: err.message || 'Invalid option payload' });
  }
};

export const selectTripOption = async (req, res) => {
  try {
    const { id } = req.params;
    const optionId = getTripOptionId(req);
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(optionId)) {
      return res.status(400).json({ msg: 'Invalid trip board or option id' });
    }

    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const instanceExists = trip.instances.some(
      (inst) => inst._id.toString() === optionId
    );
    if (!instanceExists) {
      return res.status(404).json({ msg: 'Trip option not found' });
    }

    trip.instances.forEach((inst) => {
      inst.isCommitted = inst._id.toString() === optionId;
    });
    trip.committedInstanceId = new mongoose.Types.ObjectId(String(optionId));

    await trip.save();

    return res.status(200).json({ msg: 'Trip option selected', trip });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

export const clearTripOptionSelection = async (req, res) => {
  try {
    const { id } = req.params;
    const optionId = getTripOptionId(req);
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(optionId)) {
      return res.status(400).json({ msg: 'Invalid trip board or option id' });
    }

    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const instance = trip.instances.id(optionId);
    if (!instance) return res.status(404).json({ msg: 'Trip option not found' });

    instance.isCommitted = false;

    if (trip.committedInstanceId?.toString() === optionId) {
      trip.committedInstanceId = null;
    }

    await trip.save();

    return res.status(200).json({ msg: 'Trip option selection cleared', trip });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

export const getTripOption = async (req, res) => {
  try {
    const { id } = req.params;
    const optionId = getTripOptionId(req);
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(optionId)) {
      return res.status(400).json({ msg: 'Invalid trip board or option id' });
    }

    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const instance = trip.instances.find(
      (inst) => inst._id.toString() === optionId
    );

    if (!instance) {
      return res.status(404).json({ msg: 'Trip option not found' });
    }

    return res.status(200).json({ trip, instance });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

export const updateTripOption = async (req, res) => {
  try {
    const { id } = req.params;
    const optionId = getTripOptionId(req);
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(optionId)) {
      return res.status(400).json({ msg: 'Invalid trip board or option id' });
    }

    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const instance = trip.instances.id(optionId);
    if (!instance) return res.status(404).json({ msg: 'Trip option not found' });

    const sanitized = sanitizeTripOptionPayload({
      ...instance.toObject(),
      ...req.body,
    });
    Object.assign(instance, sanitized);
    instance.isCommitted = Boolean(instance.isCommitted);
    instance.createdAt = instance.createdAt || new Date();

    await trip.save();

    return res.status(200).json({
      msg: 'Trip option updated',
      trip,
      instance,
    });
  } catch (err) {
    console.error('updateTripOption error:', err);
    return res.status(400).json({ msg: err.message || 'Invalid option payload' });
  }
};

export const deleteTripOption = async (req, res) => {
  try {
    const { id } = req.params;
    const optionId = getTripOptionId(req);
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(optionId)) {
      return res.status(400).json({ msg: 'Invalid trip board or option id' });
    }

    const trip = await findOwnedTrip(id, authCtx);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    if (trip.committedInstanceId?.toString() === optionId) {
      trip.committedInstanceId = null;
    }

    trip.instances = trip.instances.filter(
      (inst) => inst._id.toString() !== optionId
    );

    await trip.save();

    return res.status(200).json({
      msg: 'Trip option deleted',
      instances: trip.instances,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

export const getTrips = listTripBoards;
export const getFavoriteTrips = listFavoriteTripBoards;
export const createTrips = createTripBoard;
export const getSpecificTrip = getTripBoard;
export const updateTrip = updateTripBoard;
export const deleteTrip = deleteTripBoard;
export const addTripInstance = createTripOption;
export const getTripInstance = getTripOption;
export const updateTripInstance = updateTripOption;
export const commitTripInstance = selectTripOption;
export const deleteTripInstance = deleteTripOption;
