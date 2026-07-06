import { Router } from 'express';
import * as tripCtrl from '../controllers/tripCtrl.js';
import auth from '../middleware/auth.js';
import { requireBody, validateObjectIdParam } from '../middleware/validate.js';

const router = Router();

router
  .route('/boards')
  .get(auth, tripCtrl.listTripBoards)
  .post(auth, requireBody, tripCtrl.createTripBoard);

router
  .route('/boards/favorites')
  .get(auth, tripCtrl.listFavoriteTripBoards);

router
  .route('/boards/:id')
  .get(auth, validateObjectIdParam('id'), tripCtrl.getTripBoard)
  .delete(auth, validateObjectIdParam('id'), tripCtrl.deleteTripBoard)
  .put(auth, validateObjectIdParam('id'), requireBody, tripCtrl.updateTripBoard);

router.post('/boards/:id/options', auth, validateObjectIdParam('id'), requireBody, tripCtrl.createTripOption);
router.get('/boards/:id/options/:optionId', auth, validateObjectIdParam('id'), validateObjectIdParam('optionId'), tripCtrl.getTripOption);
router.put('/boards/:id/options/:optionId', auth, validateObjectIdParam('id'), validateObjectIdParam('optionId'), requireBody, tripCtrl.updateTripOption);
router.patch('/boards/:id/options/:optionId/select', auth, validateObjectIdParam('id'), validateObjectIdParam('optionId'), tripCtrl.selectTripOption);
router.delete('/boards/:id/options/:optionId/selection', auth, validateObjectIdParam('id'), validateObjectIdParam('optionId'), tripCtrl.clearTripOptionSelection);
router.delete('/boards/:id/options/:optionId', auth, validateObjectIdParam('id'), validateObjectIdParam('optionId'), tripCtrl.deleteTripOption);

router
  .route('/getaway-trip')
  .get(auth, tripCtrl.listTripBoards)
  .post(auth, requireBody, tripCtrl.createTripBoard);

router
  .route('/favorites')
  .get(auth, tripCtrl.listFavoriteTripBoards);

router
  .route('/getaway/:id')
  .get(auth, validateObjectIdParam('id'), tripCtrl.getTripBoard)
  .delete(auth, validateObjectIdParam('id'), tripCtrl.deleteTripBoard)
  .put(auth, validateObjectIdParam('id'), requireBody, tripCtrl.updateTripBoard);

router.post('/getaway/:id/instances', auth, validateObjectIdParam('id'), requireBody, tripCtrl.createTripOption);
router.get('/getaway/:id/instances/:instanceId', auth, validateObjectIdParam('id'), validateObjectIdParam('instanceId'), tripCtrl.getTripOption);
router.put('/getaway/:id/instances/:instanceId', auth, validateObjectIdParam('id'), validateObjectIdParam('instanceId'), requireBody, tripCtrl.updateTripOption);
router.patch('/getaway/:id/instances/:instanceId/commit', auth, validateObjectIdParam('id'), validateObjectIdParam('instanceId'), tripCtrl.selectTripOption);
router.delete('/getaway/:id/instances/:instanceId/commit', auth, validateObjectIdParam('id'), validateObjectIdParam('instanceId'), tripCtrl.clearTripOptionSelection);
router.delete('/getaway/:id/instances/:instanceId', auth, validateObjectIdParam('id'), validateObjectIdParam('instanceId'), tripCtrl.deleteTripOption);

export default router;
