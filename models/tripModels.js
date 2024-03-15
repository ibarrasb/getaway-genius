const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
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
    image_url:{
        type: String,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Trips', tripSchema);