import { Router } from 'express';
import * as tripCtrl from '../controllers/tripCtrl.js';
import auth from '../middleware/auth.js';

const router = Router();

// gets and posts trips made from users
router
  .route('/getaway-trip')
  .get(auth, tripCtrl.getTrips)
  .post(auth, tripCtrl.createTrips);

// get favorite trips
router.route('/favorites')
  .get(auth, tripCtrl.getFavoriteTrips);

// deletes and updates specific posts
router
  .route('/getaway/:id')
  .get(auth, tripCtrl.getSpecificTrip)
  .delete(auth, tripCtrl.deleteTrip)
  .put(auth, tripCtrl.updateTrip);

router.post('/getaway/:id/instances', auth, tripCtrl.addTripInstance);
router.get('/getaway/:id/instances/:instanceId', auth, tripCtrl.getTripInstance);
router.patch('/getaway/:id/instances/:instanceId/commit', auth, tripCtrl.commitTripInstance);
router.delete('/getaway/:id/instances/:instanceId', auth, tripCtrl.deleteTripInstance);

export default router;
