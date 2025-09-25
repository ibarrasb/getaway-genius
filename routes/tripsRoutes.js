import { Router } from 'express';
import * as tripCtrl from '../controllers/tripCtrl.js';
import auth from '../middleware/auth.js';

const router = Router();

// gets and posts trips made from users
router
  .route('/getaway-trip')
  .get(tripCtrl.getTrips)
  .post(auth, tripCtrl.createTrips);

// get favorite trips
router.route('/favorites')
  .get(tripCtrl.getFavoriteTrips);

// deletes and updates specific posts
router
  .route('/getaway/:id')
  .get(tripCtrl.getSpecificTrip)
  .delete(auth, tripCtrl.deleteTrip)
  .put(tripCtrl.updateTrip); // add `auth` here too if you want edits protected

router.post('/getaway/:id/instances', tripCtrl.addTripInstance);
router.delete('/getaway/:id/instances/:instanceId', tripCtrl.deleteTripInstance);

export default router;
