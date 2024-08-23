const Users = require('../models/userModels');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create access token
const createAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
};

// Create refresh token
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// User controller for authentication
const userCtrl = {
    register: async (req, res) => {
        try {
            const { fname, lname, email, password, birthday, city, state, zip } = req.body;

            const user = await Users.findOne({ email });
            if (user) return res.status(400).json({ msg: 'This email already exists' });

            if (password.length < 6)
                return res.status(400).json({ msg: 'Password must be at least 6 characters long' });

            // Password Encryption
            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = new Users({
                fname, lname, email, password: passwordHash, birthday, city, state, zip
            });

            // Save User to MongoDB
            await newUser.save();

            // Create jsonwebtoken for authentication
            const accesstoken = createAccessToken({ id: newUser._id });
            const refreshtoken = createRefreshToken({ id: newUser._id });

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/api/user/refresh_token'
            });

            res.json({ accesstoken });

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await Users.findOne({ email });
            if (!user) return res.status(400).json({ msg: "User does not exist." });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ msg: "Incorrect password." });

            // Create access token and refresh token
            const accesstoken = createAccessToken({ id: user._id });
            const refreshtoken = createRefreshToken({ id: user._id });

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/api/user/refresh_token'
            });

            res.json({ accesstoken });

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/api/user/refresh_token' });
            return res.json({ msg: 'Logged out' });

        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    },

    refreshToken: (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;

            if (!rf_token) return res.status(400).json({ msg: "No Cookies Saved" });

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err) return res.status(400).json({ msg: "Verify error" });
                const accesstoken = createAccessToken({ id: user.id });

                res.json({ accesstoken });
            });

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    getUser: async (req, res) => {
        try {
            // Remove password from being shown in response
            const user = await Users.findById(req.user.id).select('-password');
            if (!user) return res.status(400).json({ msg: "User does not exist." });

            res.json(user);
        } catch (error) {
            res.status(500).json({ msg: error.message });
        }
    },

    getLoggedUser: async (req, res) => {
        try {
            const detailedUser = await Users.findById(req.params.id);
            res.json(detailedUser);

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    updateUser: async (req, res) => {
        try {
            const { fname, lname, birthday, city, state, zip } = req.body;

            await Users.findOneAndUpdate({ _id: req.params.id }, {
                fname, lname, birthday, city, state, zip
            });

            res.json({ msg: "Updated User" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
};

module.exports = userCtrl;