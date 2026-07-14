import TripBoard from '../models/tripBoardModel.js';  
import Wishlist from '../models/wishlistModel.js';
import Users from '../models/userModels.js';
import mongoose from 'mongoose';
import { createHash } from 'crypto';
import { uploadImageBuffer } from '../services/cloudinary.js';
import { isPlainObject, parsePositiveInt } from '../middleware/validate.js';

const getAuthContext = async (req) => {
  if (!req.user?.id) return null;
  const user = await Users.findById(req.user.id).select('email');
  if (!user?.email) return null;
  return { userId: req.user.id, userEmail: user.email };
};

const buildTripOwnershipFilter = ({ userId }) => ({ userId });

const buildWishlistOwnershipFilter = ({ userId }) => ({ userId });

const listProjection = [
  'userId',
  'user_email',
  'board_title',
  'board_start',
  'board_end',
  'travelers',
  'location_address',
  'trip_start',
  'trip_end',
  'stay_expense',
  'travel_expense',
  'car_expense',
  'other_expense',
  'image_url',
  'image_provider',
  'image_attribution',
  'cloudinaryUploaded',
  'isFavorite',
  'activities',
  'instances',
  'committedInstanceId',
  'createdAt',
  'updatedAt',
].join(' ');

const getListOptions = (req) => {
  const page = parsePositiveInt(req.query.page, 1, { min: 1, max: 10_000 });
  const limit = parsePositiveInt(req.query.limit, 50, { min: 1, max: 100 });
  const includeInstances = req.query.includeInstances !== 'false';
  return { page, limit, skip: (page - 1) * limit, includeInstances };
};

const sendPaginatedTrips = async (res, query, options) => {
  const projection = options.includeInstances
    ? listProjection
    : listProjection.replace('instances', '');

  const [trips, total] = await Promise.all([
    TripBoard.find(query)
      .select(projection)
      .sort({ createdAt: -1 })
      .skip(options.skip)
      .limit(options.limit)
      .lean(),
    TripBoard.countDocuments(query),
  ]);

  res.set('X-Total-Count', String(total));
  res.set('X-Page', String(options.page));
  res.set('X-Limit', String(options.limit));
  res.set('X-Has-More', String(options.skip + trips.length < total));
  return res.json(trips);
};

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

const parseDateList = (values) =>
  (Array.isArray(values) ? values : [])
    .map(parseDate)
    .filter(Boolean);

const timeString = (v) => {
  const value = String(v || '').trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : '';
};

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const validateTripBoardBody = (body = {}) => {
  if (!isPlainObject(body)) return 'Request body must be an object';
  if (body.board_title !== undefined && String(body.board_title).length > 160) {
    return 'Board title is too long';
  }
  if (body.location_address !== undefined && String(body.location_address).length > 300) {
    return 'Location address is too long';
  }
  if (body.travelers !== undefined && Math.max(1, num(body.travelers, 1)) > 50) {
    return 'Travelers must be 50 or fewer';
  }
  if (body.activities !== undefined && !Array.isArray(body.activities)) {
    return 'Activities must be an array';
  }
  if (body.instances !== undefined && !Array.isArray(body.instances)) {
    return 'Trip options must be an array';
  }
  return null;
};

export const sanitizeCostItems = (items) =>
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
        purchase_status: ['considering', 'booked', 'purchased'].includes(item.purchase_status)
          ? item.purchase_status
          : 'considering',
        confirmation_code: String(item.confirmation_code || ''),
        start_date: parseDate(item.start_date),
        end_date: parseDate(item.end_date),
        check_in_time: timeString(item.check_in_time),
        check_out_time: timeString(item.check_out_time),
        depart_time: timeString(item.depart_time),
        arrive_time: timeString(item.arrive_time),
        return_depart_time: timeString(item.return_depart_time),
        return_arrive_time: timeString(item.return_arrive_time),
        ticket_day_mode: ['one_day', 'multi_range', 'exact_days'].includes(item.ticket_day_mode)
          ? item.ticket_day_mode
          : '',
        ticket_days: Math.max(1, num(item.ticket_days, 1)),
        selected_dates: parseDateList(item.selected_dates),
        notes: String(item.notes || ''),
      };

      if (mongoose.isValidObjectId(item._id)) sanitized._id = item._id;
      return sanitized;
    });

export const sanitizeTripOptionPayload = (body = {}) => ({
  option_title: String(body.option_title || ''),
  destination: String(body.destination || ''),
  image_url: String(body.image_url || ''),
  image_provider: String(body.image_provider || ''),
  image_attribution: isPlainObject(body.image_attribution) ? body.image_attribution : {},
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

export const buildTripOptionReplacement = (existingOption = {}, body = {}) => {
  const existing =
    typeof existingOption.toObject === 'function'
      ? existingOption.toObject()
      : existingOption;
  const sanitized = sanitizeTripOptionPayload({
    ...existing,
    ...body,
  });

  return {
    ...sanitized,
    _id: existing._id,
    isCommitted: Boolean(existing.isCommitted),
    createdAt: existing.createdAt || new Date(),
  };
};

export const buildTripOptionCreatePayload = (
  body = {},
  {
    id = new mongoose.Types.ObjectId(),
    createdAt = new Date(),
  } = {}
) => ({
  _id: id,
  ...sanitizeTripOptionPayload(body),
  createdAt,
  isCommitted: false,
});

export const buildTripOptionSelectionState = (instances = [], optionId) => {
  const selectedId = optionId?.toString();
  const hasSelected = instances.some((inst) => inst._id?.toString() === selectedId);
  if (!hasSelected) return null;

  return {
    instances: instances.map((inst) => {
      if (typeof inst.set === 'function') {
        inst.set('isCommitted', inst._id.toString() === selectedId);
        return inst;
      }
      return {
        ...inst,
        isCommitted: inst._id?.toString() === selectedId,
      };
    }),
    committedInstanceId: new mongoose.Types.ObjectId(String(optionId)),
  };
};

export const buildTripOptionSelectionClearState = (instances = [], optionId, committedInstanceId) => {
  const selectedId = optionId?.toString();
  const hasOption = instances.some((inst) => inst._id?.toString() === selectedId);
  if (!hasOption) return null;

  return {
    instances: instances.map((inst) => {
      if (inst._id?.toString() !== selectedId) return inst;
      if (typeof inst.set === 'function') {
        inst.set('isCommitted', false);
        return inst;
      }
      return { ...inst, isCommitted: false };
    }),
    committedInstanceId: committedInstanceId?.toString() === selectedId ? null : committedInstanceId,
  };
};

export const buildTripOptionDeletionState = (instances = [], optionId, committedInstanceId) => {
  const deletedId = optionId?.toString();
  const remainingInstances = instances.filter((inst) => inst._id?.toString() !== deletedId);

  return {
    instances: remainingInstances,
    committedInstanceId: committedInstanceId?.toString() === deletedId ? null : committedInstanceId,
  };
};

// GET /boards
export const listTripBoards = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    return sendPaginatedTrips(
      res,
      buildTripOwnershipFilter(authCtx),
      getListOptions(req)
    );
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// GET /favorites
export const listFavoriteTripBoards = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    return sendPaginatedTrips(
      res,
      { ...buildTripOwnershipFilter(authCtx), isFavorite: true },
      getListOptions(req)
    );
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// POST /boards
export const createTripBoard = async (req, res) => {
  try {
    const authCtx = await getAuthContext(req);
    if (!authCtx) return res.status(401).json({ msg: 'Invalid Authentication' });

    const validationError = validateTripBoardBody(req.body);
    if (validationError) return res.status(400).json({ msg: validationError });

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
      image_provider,
      image_attribution,
      isFavorite,
      activities,
      instances,
    } = req.body;

    image_url = image_url || '';
    image_provider = image_provider || '';
    image_attribution = isPlainObject(image_attribution) ? image_attribution : {};

    let cloudinaryUploaded = false;

    if (image_url && image_url.includes('places.googleapis.com/v1/') && image_url.includes('/media')) {
      try {
        const urlObj = new URL(image_url);
        const pathMatch = urlObj.pathname.match(/^\/v1\/(.+)\/media$/);
        
        if (pathMatch) {
          const photoreference = pathMatch[1];
          const shortHash = createHash('sha256').update(photoreference).digest('hex').slice(0, 32);
          
          const apiKey = process.env.GOOGLEAPIKEY;
          const googleMediaUrl = `https://places.googleapis.com/v1/${photoreference}/media?key=${apiKey}&maxHeightPx=1600&maxWidthPx=2400`;
          
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
      image_provider,
      image_attribution,
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
      },  
      {
        $pull: {
          trips: {
            $or: [
              { tripId: trip._id },
              { _id: tripId },
              { 'snapshot._id': tripId },
            ],
          },
        },
      }
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

    const validationError = validateTripBoardBody(req.body);
    if (validationError) return res.status(400).json({ msg: validationError });

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
      image_provider,
      image_attribution,
      isFavorite,
      activities,
      instances,
    } = req.body;

    const currentTrip = existingTrip.toObject();
    board_title = board_title ?? currentTrip.board_title;
    board_start = board_start ?? currentTrip.board_start;
    board_end = board_end ?? currentTrip.board_end;
    travelers = travelers ?? currentTrip.travelers;
    location_address = location_address ?? currentTrip.location_address;
    trip_start = trip_start ?? currentTrip.trip_start;
    trip_end = trip_end ?? currentTrip.trip_end;
    stay_expense = stay_expense ?? currentTrip.stay_expense;
    travel_expense = travel_expense ?? currentTrip.travel_expense;
    car_expense = car_expense ?? currentTrip.car_expense;
    other_expense = other_expense ?? currentTrip.other_expense;
    image_url = image_url ?? currentTrip.image_url;
    image_provider = image_provider ?? currentTrip.image_provider;
    image_attribution = image_attribution ?? currentTrip.image_attribution;
    isFavorite = isFavorite ?? currentTrip.isFavorite;
    activities = activities ?? currentTrip.activities;
    instances = instances ?? currentTrip.instances;

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
        image_provider: image_provider || '',
        image_attribution: isPlainObject(image_attribution) ? image_attribution : {},
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

    const instance = buildTripOptionCreatePayload(req.body);

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

    const nextState = buildTripOptionSelectionState(trip.instances, optionId);
    if (!nextState) return res.status(404).json({ msg: 'Trip option not found' });
    trip.committedInstanceId = nextState.committedInstanceId;

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

    const nextState = buildTripOptionSelectionClearState(
      trip.instances,
      optionId,
      trip.committedInstanceId
    );
    if (!nextState) return res.status(404).json({ msg: 'Trip option not found' });
    trip.committedInstanceId = nextState.committedInstanceId;

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

    const existingInstance = trip.instances.id(optionId);
    if (!existingInstance) return res.status(404).json({ msg: 'Trip option not found' });

    const replacement = buildTripOptionReplacement(existingInstance, req.body);
    const updatedTrip = await TripBoard.findOneAndUpdate(
      {
        _id: trip._id,
        ...buildTripOwnershipFilter(authCtx),
        'instances._id': optionId,
      },
      { $set: { 'instances.$': replacement } },
      { new: true, runValidators: true }
    );

    if (!updatedTrip) return res.status(404).json({ msg: 'Trip option not found' });

    const updatedInstance = updatedTrip.instances.id(optionId);

    return res.status(200).json({
      msg: 'Trip option updated',
      trip: updatedTrip,
      instance: updatedInstance,
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

    const nextState = buildTripOptionDeletionState(
      trip.instances,
      optionId,
      trip.committedInstanceId
    );
    trip.instances = nextState.instances;
    trip.committedInstanceId = nextState.committedInstanceId;

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
