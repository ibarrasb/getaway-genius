import Users from '../models/userModels.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Helpers to create tokens
const createAccessToken = (user) =>
  jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

const createRefreshToken = (user) =>
  jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

/**
 * Register a new user with hashed password and issue tokens
 * @param {Object} req - Express request with user data in body
 * @param {Object} res - Express response
 */
export const register = async (req, res) => {
  try {
    const { fname, lname, email, password, birthday, city, state, zip } = req.body;

    const existing = await Users.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'This email already exists' });

    if (!password || password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new Users({
      fname,
      lname,
      email,
      password: passwordHash,
      birthday,
      city,
      state,
      zip,
    });

    await newUser.save();

    const accesstoken = createAccessToken({ id: newUser._id });
    const refreshtoken = createRefreshToken({ id: newUser._id });

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshtoken', refreshtoken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/user/refresh_token',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({ accesstoken });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

/**
 * Login user with email and password
 * @param {Object} req - Express request with email and password
 * @param {Object} res - Express response
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Users.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User does not exist.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect password.' });

    const accesstoken = createAccessToken({ id: user._id });
    const refreshtoken = createRefreshToken({ id: user._id });

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshtoken', refreshtoken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/user/refresh_token',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({ accesstoken });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Logout
export const logout = async (_req, res) => {
  try {
    res.clearCookie('refreshtoken', { path: '/api/user/refresh_token' });
    return res.json({ msg: 'Logged out' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

// Refresh token
export const refreshToken = (req, res) => {
  try {
    const rf_token = req.cookies?.refreshtoken;
    if (!rf_token) return res.status(400).json({ msg: 'No Cookies Saved' });

    jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(400).json({ msg: 'Verify error' });
      const accesstoken = createAccessToken({ id: user.id });
      res.json({ accesstoken });
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Get current user (protected; needs `auth` to set req.user.id)
export const getUser = async (req, res) => {
  try {
    const user = await Users.findById(req.user.id).select('-password');
    if (!user) return res.status(400).json({ msg: 'User does not exist.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Get any user by id
export const getLoggedUser = async (req, res) => {
  try {
    const detailedUser = await Users.findById(req.params.id);
    res.json(detailedUser);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { fname, lname, birthday, city, state, zip } = req.body;
    await Users.findOneAndUpdate(
      { _id: req.params.id },
      { fname, lname, birthday, city, state, zip }
    );
    res.json({ msg: 'Updated User' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
