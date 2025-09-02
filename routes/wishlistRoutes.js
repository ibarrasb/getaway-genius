import { Router } from 'express';
import * as wishCtrl from '../controllers/wishCtrl.js';
import auth from '../middleware/auth.js';

const router = Router();

// Routes for managing wishlists
router.route('/createlist')
  .post(wishCtrl.createWishlist);

router.route('/getlists')
  .get(wishCtrl.fetchLists);

router.route('/spec-wishlist/:id')
  .get(wishCtrl.fetchWishlist);

router.route('/editlist/:id')
  .put(wishCtrl.updateList);

router.route('/addtrip/:id')
  .post(wishCtrl.addTripToWishlist);

router.route('/:wishlistId/remove-trip/:tripId')
  .delete(wishCtrl.removeTripFromWishlist);

router.route('/removewishlist/:id')
  .delete(wishCtrl.removeWishlist);

export default router;
