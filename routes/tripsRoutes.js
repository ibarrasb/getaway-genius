import { Router } from 'express';
import * as tripCtrl from '../controllers/tripCtrl.js';
import auth from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTripValidator,
  updateTripValidator,
  tripInstanceValidator,
} from '../middleware/validators.js';

const router = Router();

/**
 * @swagger
 * /api/trips/getaway-trip:
 *   get:
 *     summary: Get all trips for a user
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: List of trips
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_email
 *               - location_address
 *               - image_url
 *     responses:
 *       200:
 *         description: Trip created successfully
 *       400:
 *         description: Invalid request
 *       422:
 *         description: Validation error
 */
router
  .route('/getaway-trip')
  .get(tripCtrl.getTrips)
  .post(auth, createTripValidator, validate, tripCtrl.createTrips);

// get favorite trips
router.route('/favorites').get(tripCtrl.getFavoriteTrips);

// deletes and updates specific posts
router
  .route('/getaway/:id')
  .get(tripCtrl.getSpecificTrip)
  .delete(auth, tripCtrl.deleteTrip)
  .put(auth, updateTripValidator, validate, tripCtrl.updateTrip);

router.post(
  '/getaway/:id/instances',
  auth,
  tripInstanceValidator,
  validate,
  tripCtrl.addTripInstance
);
router.get('/getaway/:id/instances/:instanceId', auth, tripCtrl.getTripInstance);
router.patch('/getaway/:id/instances/:instanceId/commit', auth, tripCtrl.commitTripInstance);
router.delete('/getaway/:id/instances/:instanceId', auth, tripCtrl.deleteTripInstance);

export default router;
