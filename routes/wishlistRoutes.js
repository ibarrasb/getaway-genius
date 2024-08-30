const router = require('express').Router();
const wishCtrl = require('../controllers/wishCtrl');
const auth = require('../middleware/auth');

// Routes for managing wishlists
router.route('/createlist')
    .post(wishCtrl.createWishlist); // Protected route to create a new wishlist

router.route('/getlists')
    .get(wishCtrl.fetchLists); // Protected route to get all wishlists

router.route('/editlist/:id')
    .put(wishCtrl.updateList); // Protected route to update a specific wishlist

router.route('/addtrip/:id') // New route for adding trips to a wishlist
    .post(wishCtrl.addTripToWishlist);

router.route('/:wishlistId/remove-trip/:tripId')
    .delete(wishCtrl.removeTripFromWishlist); // Protected route to delete a specific wishlist

module.exports = router;
