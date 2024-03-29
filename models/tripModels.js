const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    user_email: {
        type: String,
        required: true,
    },
    location_address: {
        type: String,
        required: true,
    },
    trip_start: {
        type: String,
        required: true,
    },
    trip_end: {
        type: String,
        required: true,
    },
    stay_expense: {
        type: String,
        required: true,
    },
    travel_expense: {
        type: String,
        required: true,
    },
    car_expense: {
        type: String,
        required: true,
    },
    image_url: {
        type: String,
        required: true
    },
    isFavorite: {
        type: Boolean,
        default: false // Default value is false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Trip', tripSchema);
