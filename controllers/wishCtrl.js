const Wishlist = require('../models/wishlistModel');
const Trip = require('../models/tripModels'); // Assuming you have a Trip model
const tripCtrl = require('./tripCtrl');

const wishCtrl ={
// Create a new wishlist
createWishlist: async (req, res) => {
    try {
        const { list_name, trips, email } = req.body;
        console.log(req.body)
        // if (!user) {
        //     return res.status(400).json({ message: 'User ID is required' });
        // }
        
        const wishlist = new Wishlist({
            list_name,
            trips,
            email
        });

        await wishlist.save();
        res.json({msg: "Created a wishlist"})
    } catch (err) {
        console.log(err)
        return res.status(500).json({msg: err.message})
    }
},

// Fetch all wishlists
fetchLists: async (req, res) => {
    try {
        const user_email = req.query.email;
        const wishlists = await Wishlist.find({ email: user_email});
        res.status(200).json(wishlists);
    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
},

// Update an existing wishlist
updateList: async (req, res) => {
    try {
        const { id } = req.params;
        const { name, trips } = req.body;

        const wishlist = await Wishlist.findByIdAndUpdate(id, { name, trips }, { new: true });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        res.status(200).json(wishlist);
    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
},

// Add a trip to an existing wishlist
addTripToWishlist: async (req, res) => {

    const { id } = req.params; // Wishlist ID from the URL
    const trip = req.body; // Trip details from the request body
  
    try {
      // Find the wishlist by ID and push the new trip into the trips array
      const updatedWishlist = await Wishlist.findByIdAndUpdate(
        id,
        { $push: { trips: trip } },
        { new: true, useFindAndModify: false }
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
        
},

// Remove a trip from an existing wishlist
removeTripFromWishlist: async (req, res) => {
    const { wishlistId, tripId } = req.params;

    try {
      // Use the $pull operator to remove the trip from the trips array
      const updatedWishlist = await Wishlist.findByIdAndUpdate(
        wishlistId,
        { $pull: { trips: { _id: tripId } } },
        { new: true } // Return the modified document
      );
  
      if (!updatedWishlist) {
        return res.status(404).json({ message: 'Wishlist or trip not found' });
      }
  
      res.status(200).json({ message: 'Trip removed from wishlist successfully', updatedWishlist });
    } catch (error) {
      res.status(500).json({ message: 'Error removing trip from wishlist', error });
    }
},

removeWishlist: async (req, res) => {

  try {
    await Wishlist.findByIdAndDelete(req.params.id)
    res.json({msg: "Deleted a Wishlist"})
} catch (err) {
    return res.status(500).json({msg: err.message})
}
},

fetchWishlist: async (req, res) => {
  try {
    const detailedWishlist = await Wishlist.findById(req.params.id)
    res.json(detailedWishlist)
    
} catch (err) {
    return res.status(500).json({msg: err.message})
}
}
}
module.exports = wishCtrl

