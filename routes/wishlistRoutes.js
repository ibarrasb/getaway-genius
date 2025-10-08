import { Router } from 'express';
import * as wishCtrl from '../controllers/wishCtrl.js';
import auth from '../middleware/auth.js';

const router = Router();

router.route('/createlist').post(auth, wishCtrl.createWishlist);

router.route('/getlists').get(auth, wishCtrl.fetchLists);

router.route('/spec-wishlist/:id').get(auth, wishCtrl.fetchWishlist);

router.route('/editlist/:id').put(auth, wishCtrl.updateList);

router.route('/addtrip/:id').post(auth, wishCtrl.addTripToWishlist);

router.route('/:wishlistId/remove-trip/:tripId').delete(auth, wishCtrl.removeTripFromWishlist);

router.route('/removewishlist/:id').delete(auth, wishCtrl.removeWishlist);

export default router;
