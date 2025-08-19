import Trips from '../models/tripModels.js';

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
    await Trips.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted a Trip' });
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
