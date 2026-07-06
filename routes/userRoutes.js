import { Router } from 'express';
import * as userCtrl from '../controllers/userCtrl.js';
import auth from '../middleware/auth.js';
import { requireBody, validateObjectIdParam } from '../middleware/validate.js';

const router = Router();

// Register a new user
router.route('/register')
  .post(requireBody, userCtrl.register);

// Login a user
router.route('/login')
  .post(requireBody, userCtrl.login);

// Logout a user
router.route('/logout')
  .get(userCtrl.logout);

// Refresh token
router.route('/refresh_token')
  .get(userCtrl.refreshToken);

// Get user information (protected route)
router.route('/infor')
  .get(auth, userCtrl.getUser);

router.route('/profile/:id')
  .get(auth, validateObjectIdParam('id'), userCtrl.getLoggedUser)
  .put(auth, validateObjectIdParam('id'), requireBody, userCtrl.updateUser);

export default router;
