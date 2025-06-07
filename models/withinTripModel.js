// models/WithinTrip.js
const mongoose = require('mongoose');

const withinTripSchema = new mongoose.Schema({
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip', // This references the Trip model
        required: true
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
    other_expense: {
        type: String,
        required: true
    },
    isFavorite: {
        type: Boolean,
        default: false
    },
    activities: {
        type: Array,
        default: []
    },
    isTripCommited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WithinTrip', withinTripSchema);
