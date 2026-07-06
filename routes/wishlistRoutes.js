import { Router } from 'express';
import * as wishCtrl from '../controllers/wishCtrl.js';
import auth from '../middleware/auth.js';
import { requireBody, validateObjectIdParam } from '../middleware/validate.js';

const router = Router();

// Routes for managing wishlists
router.route('/createlist')
  .post(auth, requireBody, wishCtrl.createWishlist);

router.route('/getlists')
  .get(auth, wishCtrl.fetchLists);

router.route('/spec-wishlist/:id')
  .get(auth, validateObjectIdParam('id'), wishCtrl.fetchWishlist);

router.route('/editlist/:id')
  .put(auth, validateObjectIdParam('id'), requireBody, wishCtrl.updateList);

router.route('/addtrip/:id')
  .post(auth, validateObjectIdParam('id'), requireBody, wishCtrl.addTripToWishlist);

router.route('/:wishlistId/remove-trip/:tripId')
  .delete(auth, validateObjectIdParam('wishlistId'), validateObjectIdParam('tripId'), wishCtrl.removeTripFromWishlist);

router.route('/removewishlist/:id')
  .delete(auth, validateObjectIdParam('id'), wishCtrl.removeWishlist);

export default router;
