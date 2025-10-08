import { Router } from 'express';
import * as userCtrl from '../controllers/userCtrl.js';
import auth from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerValidator, loginValidator } from '../middleware/validators.js';

const router = Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fname
 *               - lname
 *               - email
 *               - password
 *               - birthday
 *               - city
 *               - state
 *               - zip
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Email already exists
 *       422:
 *         description: Validation error
 */
router.route('/register').post(registerValidator, validate, userCtrl.register);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid credentials
 *       422:
 *         description: Validation error
 */
router.route('/login').post(loginValidator, validate, userCtrl.login);

// Logout a user
router.route('/logout').get(userCtrl.logout);

// Refresh token
router.route('/refresh_token').get(userCtrl.refreshToken);

// Get user information (protected route)
router.route('/infor').get(auth, userCtrl.getUser);

router.route('/profile/:id').get(auth, userCtrl.getLoggedUser).put(auth, userCtrl.updateUser);

export default router;
