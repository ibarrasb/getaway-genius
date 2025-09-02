// controllers/wishCtrl.js (ESM)

import Wishlist from '../models/wishlistModel.js';

// Create a new wishlist
export const createWishlist = async (req, res) => {
  try {
    const { list_name, trips, email } = req.body;

    const wishlist = new Wishlist({
      list_name,
      trips,
      email,
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
    const user_email = req.query.email;
    const wishlists = await Wishlist.find({ email: user_email });
    res.status(200).json(wishlists);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Update an existing wishlist
export const updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { list_name, trips } = req.body; // use list_name to be consistent

    const wishlist = await Wishlist.findByIdAndUpdate(
      id,
      { list_name, trips },
      { new: true }
    );

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    res.status(200).json(wishlist);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Add a trip to an existing wishlist
export const addTripToWishlist = async (req, res) => {
  const { id } = req.params; // Wishlist ID
  const trip = req.body;     // Trip object

  try {
    const updatedWishlist = await Wishlist.findByIdAndUpdate(
      id,
      { $push: { trips: trip } },
      { new: true }
    );

    if (!updatedWishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    res.status(200).json({
      message: 'Trip added to wishlist successfully',
      wishlist: updatedWishlist,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding trip to wishlist', error });
  }
};

// Remove a trip from an existing wishlist
export const removeTripFromWishlist = async (req, res) => {
  const { wishlistId, tripId } = req.params;

  try {
    const updatedWishlist = await Wishlist.findByIdAndUpdate(
      wishlistId,
      { $pull: { trips: { _id: tripId } } },
      { new: true }
    );

    if (!updatedWishlist) {
      return res
        .status(404)
        .json({ message: 'Wishlist or trip not found' });
    }

    res
      .status(200)
      .json({ message: 'Trip removed from wishlist successfully', updatedWishlist });
  } catch (error) {
    res.status(500).json({ message: 'Error removing trip from wishlist', error });
  }
};

// Remove an entire wishlist
export const removeWishlist = async (req, res) => {
  try {
    await Wishlist.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted a Wishlist' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Fetch one wishlist by ID
export const fetchWishlist = async (req, res) => {
  try {
    const detailedWishlist = await Wishlist.findById(req.params.id);
    res.json(detailedWishlist);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
