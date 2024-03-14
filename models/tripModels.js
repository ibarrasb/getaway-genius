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
    images:{
        type: Object,
        required: true
    },
    place_id: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Trips', tripSchema);