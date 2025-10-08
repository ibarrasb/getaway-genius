import { body, param } from 'express-validator';

export const registerValidator = [
  body('fname').trim().notEmpty().withMessage('First name is required'),
  body('lname').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('birthday').isISO8601().withMessage('Valid date is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zip').isInt().withMessage('Valid zip code is required'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const createTripValidator = [
  body('user_email').isEmail().withMessage('Valid email is required'),
  body('location_address').trim().notEmpty().withMessage('Location is required'),
  body('trip_start').optional().isISO8601().withMessage('Valid start date required'),
  body('trip_end').optional().isISO8601().withMessage('Valid end date required'),
  body('stay_expense').optional().isFloat({ min: 0 }).withMessage('Stay expense must be >= 0'),
  body('travel_expense').optional().isFloat({ min: 0 }).withMessage('Travel expense must be >= 0'),
  body('car_expense').optional().isFloat({ min: 0 }).withMessage('Car expense must be >= 0'),
  body('other_expense').optional().isFloat({ min: 0 }).withMessage('Other expense must be >= 0'),
  body('image_url').notEmpty().withMessage('Image URL is required'),
];

export const updateTripValidator = [
  param('id').isMongoId().withMessage('Valid trip ID is required'),
  body('location_address').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('stay_expense').optional().isFloat({ min: 0 }).withMessage('Stay expense must be >= 0'),
  body('travel_expense').optional().isFloat({ min: 0 }).withMessage('Travel expense must be >= 0'),
  body('car_expense').optional().isFloat({ min: 0 }).withMessage('Car expense must be >= 0'),
  body('other_expense').optional().isFloat({ min: 0 }).withMessage('Other expense must be >= 0'),
];

export const tripInstanceValidator = [
  body('trip_start').optional().isISO8601().withMessage('Valid start date required'),
  body('trip_end').optional().isISO8601().withMessage('Valid end date required'),
  body('stay_expense').optional().isFloat({ min: 0 }).withMessage('Stay expense must be >= 0'),
  body('travel_expense').optional().isFloat({ min: 0 }).withMessage('Travel expense must be >= 0'),
  body('car_expense').optional().isFloat({ min: 0 }).withMessage('Car expense must be >= 0'),
  body('other_expense').optional().isFloat({ min: 0 }).withMessage('Other expense must be >= 0'),
];
