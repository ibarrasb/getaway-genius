import Trips from '../models/tripModels.js';  
import Wishlist from '../models/wishlistModel.js';
import mongoose from 'mongoose';

// GET /getaway-trip?email=...
export const getTrips = async (req, res) => {
  try {
    const user_email = req.query.email;
    const trips = await Trips.find({ user_email });
    res.json(trips);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// GET /favorites?email=...
export const getFavoriteTrips = async (req, res) => {
  try {
    const user_email = req.query.email;
    const trips = await Trips.find({ user_email, isFavorite: true });
    res.json(trips);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// POST /getaway-trip
export const createTrips = async (req, res) => {
  try {
    const {
      user_email,
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

    if (!image_url) return res.status(400).json({ msg: 'No image upload' });

    const newVacation = new Trips({
      user_email,
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
    });

    await newVacation.save();
    res.json({ msg: 'Created a planned trip' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// DELETE /getaway/:id
export const deleteTrip = async (req, res) => {  
  try {  
    const tripId = req.params.id;  
      
    // Remove trip from all wishlists that contain it  
    await Wishlist.updateMany(  
      { "trips._id": tripId },  
      { $pull: { trips: { _id: tripId } } }  
    );  
      
    // Delete the trip itself  
    await Trips.findByIdAndDelete(tripId);  
      
    res.json({ msg: 'Deleted a Trip and removed from all wishlists' });  
  } catch (err) {  
    return res.status(500).json({ msg: err.message });  
  }  
};

// PUT /getaway/:id
export const updateTrip = async (req, res) => {
  try {
    const {
      user_email,
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

    await Trips.findOneAndUpdate(
      { _id: req.params.id },
      {
        user_email,
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
      }
    );

    res.json({ msg: 'Updated a Trip' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
// POST /getaway/:id/instances
// POST /getaway/:id/instances
export const addTripInstance = async (req, res) => {
  try {
    const { id } = req.params;

    // Debug (TEMP): verify what's arriving
    // console.log('addTripInstance body:', req.body);

    const parseDate = (v) => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d; // guard against "Invalid Date"
    };

    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const instance = {
      _id: new mongoose.Types.ObjectId(),
      trip_start: parseDate(req.body.trip_start),
      trip_end: parseDate(req.body.trip_end),
      stay_expense: num(req.body.stay_expense),
      travel_expense: num(req.body.travel_expense),
      car_expense: num(req.body.car_expense),
      other_expense: num(req.body.other_expense),
      createdAt: new Date(),
      isCommitted: false,
    };

    const updated = await Trips.findByIdAndUpdate(
      id,
      { $push: { instances: instance } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Trip not found' });

    return res.status(201).json(instance);
  } catch (err) {
    console.error('addTripInstance error:', err);
    return res.status(400).json({ msg: err.message || 'Invalid instance payload' });
  }
};

export const deleteTripInstance = async (req, res) => {
  try {
    const { id, instanceId } = req.params;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(instanceId)) {
      return res.status(400).json({ msg: 'Invalid trip or instance id' });
    }

    const updated = await Trips.findByIdAndUpdate(
      id,
      { $pull: { instances: { _id: new mongoose.Types.ObjectId(instanceId) } } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Trip not found' });

    return res.status(200).json({
      msg: 'Instance deleted',
      instances: updated.instances,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// GET /getaway/:id
export const getSpecificTrip = async (req, res) => {
  try {
    const detailedTrip = await Trips.findById(req.params.id);
    res.json(detailedTrip);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
