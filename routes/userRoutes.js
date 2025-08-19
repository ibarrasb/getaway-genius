import { Router } from 'express';
import * as userCtrl from '../controllers/userCtrl.js';
import auth from '../middleware/auth.js';

const router = Router();

// Register a new user
router.route('/register')
  .post(userCtrl.register);

// Login a user
router.route('/login')
  .post(userCtrl.login);

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
  .get(userCtrl.getLoggedUser)
  .put(userCtrl.updateUser);

export default router;
