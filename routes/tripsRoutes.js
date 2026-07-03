import { Router } from 'express';
import * as tripCtrl from '../controllers/tripCtrl.js';
import auth from '../middleware/auth.js';

const router = Router();

router
  .route('/boards')
  .get(auth, tripCtrl.listTripBoards)
  .post(auth, tripCtrl.createTripBoard);

router
  .route('/boards/favorites')
  .get(auth, tripCtrl.listFavoriteTripBoards);

router
  .route('/boards/:id')
  .get(auth, tripCtrl.getTripBoard)
  .delete(auth, tripCtrl.deleteTripBoard)
  .put(auth, tripCtrl.updateTripBoard);

router.post('/boards/:id/options', auth, tripCtrl.createTripOption);
router.get('/boards/:id/options/:optionId', auth, tripCtrl.getTripOption);
router.put('/boards/:id/options/:optionId', auth, tripCtrl.updateTripOption);
router.patch('/boards/:id/options/:optionId/select', auth, tripCtrl.selectTripOption);
router.delete('/boards/:id/options/:optionId/selection', auth, tripCtrl.clearTripOptionSelection);
router.delete('/boards/:id/options/:optionId', auth, tripCtrl.deleteTripOption);

router
  .route('/getaway-trip')
  .get(auth, tripCtrl.listTripBoards)
  .post(auth, tripCtrl.createTripBoard);

router
  .route('/favorites')
  .get(auth, tripCtrl.listFavoriteTripBoards);

router
  .route('/getaway/:id')
  .get(auth, tripCtrl.getTripBoard)
  .delete(auth, tripCtrl.deleteTripBoard)
  .put(auth, tripCtrl.updateTripBoard);

router.post('/getaway/:id/instances', auth, tripCtrl.createTripOption);
router.get('/getaway/:id/instances/:instanceId', auth, tripCtrl.getTripOption);
router.put('/getaway/:id/instances/:instanceId', auth, tripCtrl.updateTripOption);
router.patch('/getaway/:id/instances/:instanceId/commit', auth, tripCtrl.selectTripOption);
router.delete('/getaway/:id/instances/:instanceId/commit', auth, tripCtrl.clearTripOptionSelection);
router.delete('/getaway/:id/instances/:instanceId', auth, tripCtrl.deleteTripOption);

export default router;
