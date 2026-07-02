import Users from '../models/userModels.js';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';

// Helpers to create tokens
const getJwtSecret = (secret) => new TextEncoder().encode(secret);

const createToken = (payload, secret, expiresIn) =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret(secret));

const verifyToken = async (token, secret) => {
  const { payload } = await jwtVerify(token, getJwtSecret(secret));
  return payload;
};

const createAccessToken = (user) =>
  createToken(user, process.env.ACCESS_TOKEN_SECRET, '1d');

const createRefreshToken = (user) =>
  createToken(user, process.env.REFRESH_TOKEN_SECRET, '7d');

// Register
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
      fname, lname, email, password: passwordHash, birthday, city, state, zip,
    });

    await newUser.save();

    const accesstoken = await createAccessToken({ id: newUser._id.toString() });
    const refreshtoken = await createRefreshToken({ id: newUser._id.toString() });

    res.cookie('refreshtoken', refreshtoken, {
      httpOnly: true,
      path: '/api/user/refresh_token',
      // optional hardening:
      // secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
      // maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accesstoken });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Users.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User does not exist.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect password.' });

    const accesstoken = await createAccessToken({ id: user._id.toString() });
    const refreshtoken = await createRefreshToken({ id: user._id.toString() });

    res.cookie('refreshtoken', refreshtoken, {
      httpOnly: true,
      path: '/api/user/refresh_token',
      // secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
      // maxAge: 7 * 24 * 60 * 60 * 1000,
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
export const refreshToken = async (req, res) => {
  try {
    const rf_token = req.cookies?.refreshtoken;
    if (!rf_token) return res.status(400).json({ msg: 'No Cookies Saved' });

    const user = await verifyToken(rf_token, process.env.REFRESH_TOKEN_SECRET);
    const accesstoken = await createAccessToken({ id: user.id });
    res.json({ accesstoken });
  } catch (err) {
    if (err.code?.startsWith('ERR_JWT')) {
      return res.status(400).json({ msg: 'Verify error' });
    }
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
    if (!req.user?.id) return res.status(401).json({ msg: 'Invalid Authentication' });
    if (req.user.id !== req.params.id) return res.status(403).json({ msg: 'Forbidden' });

    const detailedUser = await Users.findById(req.params.id).select('-password');
    if (!detailedUser) return res.status(404).json({ msg: 'User does not exist.' });

    res.json(detailedUser);
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ msg: 'Invalid Authentication' });
    if (req.user.id !== req.params.id) return res.status(403).json({ msg: 'Forbidden' });

    const { fname, lname, birthday, city, state, zip } = req.body;
    const updated = await Users.findOneAndUpdate(
      { _id: req.params.id },
      { fname, lname, birthday, city, state, zip },
      { new: true }
    );
    if (!updated) return res.status(404).json({ msg: 'User does not exist.' });

    res.json({ msg: 'Updated User' });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
