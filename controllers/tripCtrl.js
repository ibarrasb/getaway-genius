import Trips from '../models/tripModels.js';  
import Wishlist from '../models/wishlistModel.js';
import mongoose from 'mongoose';
import { createHash } from 'crypto';
import { uploadImageBuffer } from '../services/cloudinary.js';

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
    let {
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

    let cloudinaryUploaded = false;

    if (image_url.includes('places.googleapis.com/v1/') && image_url.includes('/media')) {
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
      user_email,
      location_address,
      trip_start,
      trip_end,
      stay_expense,
      travel_expense,
      car_expense,
      other_expense,
      image_url,
      cloudinaryUploaded,
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

// GET /getaway/:id
export const getSpecificTrip = async (req, res) => {
  try {
    const detailedTrip = await Trips.findById(req.params.id);
    res.json(detailedTrip);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

//TRIP INSTANCES------------
export const addTripInstance = async (req, res) => {
  try {
    const { id } = req.params;

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

export const commitTripInstance = async (req, res) => {
  try {
    const { id, instanceId } = req.params;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(instanceId)) {
      return res.status(400).json({ msg: 'Invalid trip or instance id' });
    }

    const trip = await Trips.findById(id);
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

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(instanceId)) {
      return res.status(400).json({ msg: 'Invalid trip or instance id' });
    }

    const trip = await Trips.findById(id);
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

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(instanceId)) {
      return res.status(400).json({ msg: 'Invalid trip or instance id' });
    }

    const trip = await Trips.findById(id);
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



