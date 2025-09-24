import express from 'express';
import {
  createTripInstance,
  getTripInstances,
  getTripInstance,
  updateTripInstance,
  deleteTripInstance,
  commitTripInstance,
  uncommitTripInstance
} from '../controllers/tripInstanceCtrl.js';

const router = express.Router();

router.post('/trips/:tripId/instances', createTripInstance);
router.get('/trips/:tripId/instances', getTripInstances);
router.get('/instances/:instanceId', getTripInstance);
router.patch('/trips/:tripId/instances/:instanceId', updateTripInstance);
router.delete('/trips/:tripId/instances/:instanceId', deleteTripInstance);

router.post('/trips/:tripId/instances/:instanceId/commit', commitTripInstance);
router.post('/trips/:tripId/instances/:instanceId/uncommit', uncommitTripInstance);

export default router;
